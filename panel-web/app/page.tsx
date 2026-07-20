'use client';
import { createClient } from '@supabase/supabase-js';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Conexión a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardSkopeDark() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar reportes de la base de datos de Oscar/Adhemar
  const cargarReportes = async () => {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setReportes(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  // Cambiar estado del reporte desde el panel
  const cambiarEstado = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('reportes')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) cargarReportes();
  };

  // Contadores
  const total = reportes.length;
  const verificados = reportes.filter((r) => r.estado === 'verificado').length;
  const pendientes = reportes.filter((r) => r.estado === 'pendiente').length;

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F1F5F9] font-sans flex flex-col">
      
      {/* 1. HEADER CON PALETA SKOPE (#2563EB) */}
      <header className="bg-[#0F172A] border-b border-[#1E293B] px-6 py-3.5 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Skope <span className="text-[11px] font-normal text-[#757881] bg-[#1E293B] px-2 py-0.5 rounded-full border border-slate-700">La Paz — GAMLP</span>
            </h1>
            <p className="text-xs text-[#757881]">Centro de Control de Reportes Vecinales</p>
          </div>
        </div>

        {/* MÉTRICAS CON COLORES LUMINOUS CIVIC (#2563EB, #10B981, #F59E0B) */}
        <div className="flex gap-2">
          <div className="bg-[#1E293B]/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] text-[#757881] uppercase font-semibold">Total</span>
            <span className="text-sm font-bold text-[#2563EB]">{total}</span>
          </div>
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 px-3.5 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] text-[#10B981] uppercase font-semibold">Verificados</span>
            <span className="text-sm font-bold text-[#10B981]">{verificados}</span>
          </div>
          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3.5 py-1.5 rounded-xl text-center">
            <span className="block text-[10px] text-[#F59E0B] uppercase font-semibold">Pendientes</span>
            <span className="text-sm font-bold text-[#F59E0B]">{pendientes}</span>
          </div>
        </div>
      </header>

      {/* 2. ESTRUCTURA DEL DASHBOARD EN MODO OSCURO */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        
        {/* PANEL DEL MAPA (2/3 DE PANTALLA) */}
        <section className="lg:col-span-8 bg-[#0F172A] rounded-2xl border border-[#1E293B] overflow-hidden shadow-2xl flex flex-col relative min-h-[480px]">
          <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1E293B] flex justify-between items-center z-10">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping"></span>
              Monitoreo Territorial en Tiempo Real
            </span>
            <span className="text-[11px] text-[#757881] font-mono">OpenStreetMap Layer</span>
          </div>

          <div className="flex-1 relative w-full h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full text-[#757881] text-sm">
                Cargando mapa de incidentes...
              </div>
            ) : (
              <MapContainer
                center={[-16.5000, -68.1200]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {reportes.map((item) => (
                  <Marker
                    key={item.id}
                    position={[parseFloat(item.latitud || -16.5000), parseFloat(item.longitud || -68.1200)]}
                  >
                    <Popup>
                      <div className="p-1 font-sans text-slate-900">
                        <h3 className="font-bold text-xs border-b pb-1 mb-1">{item.titulo}</h3>
                        <p className="text-[11px] text-slate-600 mb-2">{item.descripcion}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.estado === 'verificado' ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-[#F59E0B]/20 text-[#B45309]'
                        }`}>
                          {item.estado}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </section>

        {/* PANEL LATERAL DE ALERTAS (ESTILO TARJETAS SKOPE) */}
        <section className="lg:col-span-4 bg-[#0F172A] rounded-2xl border border-[#1E293B] p-4 flex flex-col h-[78vh] shadow-xl">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1E293B]">
            <h2 className="text-sm font-bold text-white tracking-wide">Feed de Alertas</h2>
            <span className="text-[10px] bg-[#1E293B] text-[#2563EB] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
              {reportes.length} Activas
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {reportes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-[#757881]">No hay reportes recibidos desde la App.</p>
              </div>
            ) : (
              reportes.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#1E293B]/60 rounded-xl p-3.5 border border-slate-800 hover:border-[#2563EB]/50 transition shadow-sm"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-semibold text-xs text-white">{item.titulo}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      item.estado === 'verificado' 
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' 
                        : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                    }`}>
                      {item.estado}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#757881] mb-3 line-clamp-2 leading-relaxed">
                    {item.descripcion}
                  </p>

                  {/* BOTONES CON BOTÓN PRIMARIO #2563EB Y SECUNDARIO #10B981 */}
                  <div className="flex gap-2 border-t border-slate-800/80 pt-2.5">
                    <button
                      onClick={() => cambiarEstado(item.id, 'verificado')}
                      className="flex-1 bg-[#2563EB] hover:bg-blue-600 active:scale-95 text-white text-[10px] font-semibold py-1.5 rounded-lg transition shadow-md shadow-blue-500/10"
                    >
                      Aprobar (#2563EB)
                    </button>
                    <button
                      onClick={() => cambiarEstado(item.id, 'atendido')}
                      className="flex-1 bg-[#10B981]/20 hover:bg-[#10B981]/30 active:scale-95 text-[#10B981] text-[10px] font-semibold py-1.5 rounded-lg transition border border-[#10B981]/30"
                    >
                      Resolver (#10B981)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}