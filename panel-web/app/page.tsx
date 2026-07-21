'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// ==========================================
// 1. CLASIFICACIÓN DE MACRODISTRITOS Y COORDENADAS
// ==========================================
function obtenerMacrodistrito(item: any): string {
  if (item.macrodistrito) return item.macrodistrito.toLowerCase();

  const texto = `${item.titulo || ''} ${item.descripcion || ''}`.toLowerCase();
  
  if (texto.includes('prado') || texto.includes('centro') || texto.includes('sopocachi') || texto.includes('miraflores')) {
    return 'centro';
  }
  if (texto.includes('cotahuma') || texto.includes('tembladerani')) {
    return 'cotahuma';
  }
  if (texto.includes('max paredes') || texto.includes('buenos aires') || texto.includes('cementerio')) {
    return 'max_paredes';
  }
  if (texto.includes('periferica') || texto.includes('achachicala')) {
    return 'periferica';
  }
  if (texto.includes('san antonio') || texto.includes('pampahasi') || texto.includes('villa fátima')) {
    return 'san_antonio';
  }
  if (texto.includes('sur') || texto.includes('calacoto') || texto.includes('irpavi') || texto.includes('achumani')) {
    return 'sur';
  }

  return 'centro';
}

// Coordenadas y límites (bbox) para centrar el mapa de OpenStreetMap según el macrodistrito
function obtenerCoordenadasZona(zona: string) {
  switch (zona) {
    case 'centro':
      return { lat: -16.5000, lon: -68.1315, bbox: '-68.15,-16.52,-68.11,-16.48' };
    case 'cotahuma':
      return { lat: -16.5100, lon: -68.1500, bbox: '-68.17,-16.53,-68.13,-16.49' };
    case 'max_paredes':
      return { lat: -16.4800, lon: -68.1600, bbox: '-68.18,-16.50,-68.14,-16.46' };
    case 'periferica':
      return { lat: -16.4700, lon: -68.1300, bbox: '-68.15,-16.49,-68.11,-16.45' };
    case 'san_antonio':
      return { lat: -16.5000, lon: -68.1100, bbox: '-68.13,-16.52,-68.09,-16.48' };
    case 'sur':
      return { lat: -16.5400, lon: -68.0800, bbox: '-68.10,-16.57,-68.06,-16.51' };
    default: // 'todos'
      return { lat: -16.5000, lon: -68.1315, bbox: '-68.16,-16.53,-68.10,-16.48' };
  }
}

// ==========================================
// 2. ENCABEZADO Y FILTROS
// ==========================================
function DashboardHeader({ reportes, zonaSeleccionada, setZonaSeleccionada }: any) {
  const totalReportes = reportes.length;
  const verificados = reportes.filter((r: any) => r.estado === 'verificado').length;

  return (
    <div className="p-4 space-y-4 bg-slate-900 text-white rounded-xl mb-6 border border-slate-800 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-sky-400 flex items-center gap-2">
            📊 Monitoreo Geográfico - La Paz
          </h1>
          <p className="text-xs text-slate-400">Sistema SKOPE de alertas urbanas en tiempo real</p>
        </div>

        <select
          value={zonaSeleccionada}
          onChange={(e) => setZonaSeleccionada(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
        >
          <option value="todos">📍 Todos los Macrodistritos</option>
          <option value="centro">Macrodistrito Centro (El Prado / Sopocachi / Miraflores)</option>
          <option value="cotahuma">Macrodistrito Cotahuma</option>
          <option value="max_paredes">Macrodistrito Max Paredes</option>
          <option value="periferica">Macrodistrito Periférica</option>
          <option value="san_antonio">Macrodistrito San Antonio</option>
          <option value="sur">Macrodistrito Zona Sur</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400">Total Incidentes</p>
          <p className="text-2xl font-black text-white">{totalReportes}</p>
        </div>
        <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400">Verificados</p>
          <p className="text-2xl font-black text-emerald-400">{verificados}</p>
        </div>
        <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400">Filtro Activo</p>
          <p className="text-sm font-bold text-amber-400 uppercase mt-1">{zonaSeleccionada}</p>
        </div>
        <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400">Estado Conexión</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span> Supabase En Vivo
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. PÁGINA PRINCIPAL
// ==========================================
export default function Home() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState('todos');

  useEffect(() => {
    async function obtenerReportes() {
      const { data } = await supabase.from('reportes').select('*');
      if (data) setReportes(data);
    }
    obtenerReportes();
  }, []);

  // Filtrado de reportes según la zona elegida
  const reportesFiltrados = reportes.filter((item) => {
    if (zonaSeleccionada === 'todos') return true;
    return obtenerMacrodistrito(item) === zonaSeleccionada;
  });

  // Obtener coordenadas dinámicas según el selector
  const coordsActuales = obtenerCoordenadasZona(zonaSeleccionada);

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-6 text-slate-100">
      <DashboardHeader 
        reportes={reportesFiltrados} 
        zonaSeleccionada={zonaSeleccionada} 
        setZonaSeleccionada={setZonaSeleccionada} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAPA DINÁMICO */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col">
          <h3 className="text-md font-semibold text-slate-300 mb-3 flex items-center gap-2">
            🗺️ Mapa de Monitoreo Urbano - Zona: <span className="uppercase text-sky-400">{zonaSeleccionada}</span>
          </h3>
          
          <div className="w-full h-[500px] bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center relative">
            <iframe
              key={zonaSeleccionada}
              className="w-full h-full border-0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordsActuales.bbox}&layer=mapnik&marker=${coordsActuales.lat},${coordsActuales.lon}`}
              title="Mapa Dinámico La Paz"
            ></iframe>
          </div>
        </div>

        {/* LISTADO LATERAL */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col h-[560px]">
          <h3 className="text-md font-semibold text-slate-300 mb-3">
            🔔 Incidentes Filtrados ({reportesFiltrados.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {reportesFiltrados.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No hay incidentes registrados para este macrodistrito.
              </p>
            ) : (
              reportesFiltrados.map((item) => (
                <div key={item.id} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.estado || 'verificado'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      📍 {obtenerMacrodistrito(item)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-200 mt-1 text-sm">{item.titulo}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.descripcion}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}