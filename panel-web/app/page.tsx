'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// ==========================================
// 1. EXTRACTOR DE FOTOS
// ==========================================
function obtenerUrlImagen(item: any): string | null {
  if (!item) return null;

  if (item.fotos_urls) {
    if (Array.isArray(item.fotos_urls) && item.fotos_urls.length > 0) {
      return item.fotos_urls[0];
    }
    if (typeof item.fotos_urls === 'string' && item.fotos_urls.trim() !== '') {
      return item.fotos_urls;
    }
  }

  const datoImagen = item.imagen_url || item.foto_url || item.imagen || item.foto || item.url_imagen;
  if (typeof datoImagen === 'string' && datoImagen.startsWith('http')) {
    return datoImagen;
  }

  return null;
}

// ==========================================
// 2. CLASIFICACIÓN DE MACRODISTRITOS
// ==========================================
function obtenerMacrodistrito(item: any): string {
  if (item.macrodistrito && item.macrodistrito !== 'Centro') {
    return item.macrodistrito.toLowerCase().replace(' ', '_');
  }

  const texto = `${item.titulo || ''} ${item.descripcion || ''}`.toLowerCase();
  
  if (texto.includes('periferica') || texto.includes('periférica') || texto.includes('achachicala') || texto.includes('vininto')) {
    return 'periferica';
  }
  if (texto.includes('cotahuma') || texto.includes('tembladerani')) {
    return 'cotahuma';
  }
  if (texto.includes('max paredes') || texto.includes('buenos aires') || texto.includes('cementerio')) {
    return 'max_paredes';
  }
  if (texto.includes('san antonio') || texto.includes('pampahasi') || texto.includes('villa fátima')) {
    return 'san_antonio';
  }
  if (texto.includes('sur') || texto.includes('calacoto') || texto.includes('irpavi') || texto.includes('achumani')) {
    return 'sur';
  }

  const lat = parseFloat(item.latitud);
  if (lat && lat > -16.485) {
    return 'periferica';
  }

  return 'centro';
}

function obtenerCoordenadasZona(zona: string) {
  switch (zona) {
    case 'periferica':
      return { lat: -16.4700, lon: -68.1300, bbox: '-68.1400,-16.4800,-68.1200,-16.4600' };
    case 'cotahuma':
      return { lat: -16.5100, lon: -68.1500, bbox: '-68.1600,-16.5200,-68.1400,-16.5000' };
    case 'max_paredes':
      return { lat: -16.4800, lon: -68.1600, bbox: '-68.1700,-16.4900,-68.1500,-16.4700' };
    case 'san_antonio':
      return { lat: -16.5000, lon: -68.1100, bbox: '-68.1200,-16.5100,-68.1000,-16.4900' };
    case 'sur':
      return { lat: -16.5400, lon: -68.0800, bbox: '-68.0900,-16.5500,-68.0700,-16.5300' };
    case 'centro':
    default:
      return { lat: -16.5000, lon: -68.1315, bbox: '-68.1500,-16.5100,-68.1100,-16.4900' };
  }
}

// ESTILOS DINÁMICOS POR ESTADO
function obtenerBadgeEstado(estado: string) {
  const est = (estado || 'pendiente').toLowerCase();
  if (est === 'finalizado' || est === 'resuelto') {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
  if (est === 'en_proceso' || est === 'en proceso') {
    return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
  }
  return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
}

// ==========================================
// 3. PÁGINA PRINCIPAL
// ==========================================
export default function Home() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState('todos');
  const [reporteModal, setReporteModal] = useState<any | null>(null);
  const [reporteEnfocadoId, setReporteEnfocadoId] = useState<any | null>(null);
  const [coordsMapa, setCoordsMapa] = useState<any>(obtenerCoordenadasZona('todos'));

  useEffect(() => {
    async function obtenerReportes() {
      const { data } = await supabase.from('reportes').select('*');
      if (data) setReportes(data);
    }
    obtenerReportes();
  }, []);

  useEffect(() => {
    setCoordsMapa(obtenerCoordenadasZona(zonaSeleccionada));
  }, [zonaSeleccionada]);

  const reportesFiltrados = reportes.filter((item) => {
    if (zonaSeleccionada === 'todos') return true;
    return obtenerMacrodistrito(item) === zonaSeleccionada;
  });

  const enfocarEnMapa = (item: any) => {
    setReporteEnfocadoId(item.id);

    let lat = parseFloat(item.latitud);
    let lon = parseFloat(item.longitud);

    if (isNaN(lat) || isNaN(lon) || !lat || !lon) {
      const macro = obtenerMacrodistrito(item);
      const coordsMacro = obtenerCoordenadasZona(macro);
      lat = coordsMacro.lat;
      lon = coordsMacro.lon;
    }

    const delta = 0.005;
    const minLon = (lon - delta).toFixed(4);
    const minLat = (lat - delta).toFixed(4);
    const maxLon = (lon + delta).toFixed(4);
    const maxLat = (lat + delta).toFixed(4);

    setCoordsMapa({
      lat: lat,
      lon: lon,
      bbox: `${minLon},${minLat},${maxLon},${maxLat}`
    });
  };

  // Cambiar estado en Supabase
  const cambiarEstado = async (id: any, nuevoEstado: string) => {
    const { error } = await supabase
      .from('reportes')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      setReportes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
      );
      if (reporteModal && reporteModal.id === id) {
        setReporteModal({ ...reporteModal, estado: nuevoEstado });
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-6 text-slate-100 relative">
      
      {/* HEADER */}
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
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none cursor-pointer"
          >
            <option value="todos">📍 Todos los Macrodistritos</option>
            <option value="centro">Macrodistrito Centro</option>
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
            <p className="text-2xl font-black text-white">{reportesFiltrados.length}</p>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-400">En Proceso / Resueltos</p>
            <p className="text-2xl font-black text-emerald-400">
              {reportesFiltrados.filter((r: any) => r.estado && r.estado !== 'pendiente').length}
            </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAPA PRINCIPAL */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col">
          <h3 className="text-md font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span>🗺️ Monitoreo Urbano - Zona: <span className="uppercase text-sky-400">{zonaSeleccionada}</span></span>
          </h3>
          
          <div className="w-full h-[500px] bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 relative">
            <iframe
              key={`${coordsMapa.lat}-${coordsMapa.lon}-${coordsMapa.bbox}`}
              className="w-full h-full border-0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordsMapa.bbox}&layer=mapnik&marker=${coordsMapa.lat},${coordsMapa.lon}`}
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
              reportesFiltrados.map((item) => {
                const macro = obtenerMacrodistrito(item);
                const esEnfocado = reporteEnfocadoId === item.id;
                const badgeEstilo = obtenerBadgeEstado(item.estado);

                return (
                  <div 
                    key={item.id} 
                    onClick={() => enfocarEnMapa(item)}
                    className={`p-3 bg-slate-800/60 rounded-lg border transition-all cursor-pointer ${
                      esEnfocado ? 'border-sky-400 bg-slate-800 ring-2 ring-sky-400/50' : 'border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeEstilo}`}>
                        {item.estado || 'PENDIENTE'}
                      </span>
                      <span className="text-[10px] text-sky-400 font-semibold uppercase">
                        📍 {macro}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-200 mt-2 text-sm">{item.titulo}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.descripcion}</p>
                    
                    <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-500">
                        Nivel: <strong className="text-slate-300 capitalize">{item.nivel_fiabilidad || 'Confiable'}</strong>
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReporteModal(item);
                        }}
                        className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium px-2.5 py-1 rounded transition-colors shadow"
                      >
                        🔍 Ver Detalles
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* MODAL DETALLES CON BOTONES DE CAMBIO DE ESTADO */}
      {reporteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
            
            <button 
              onClick={() => setReporteModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center border border-slate-700"
            >
              ✕
            </button>

            <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded border ${obtenerBadgeEstado(reporteModal.estado)}`}>
              ESTADO: {reporteModal.estado || 'PENDIENTE'}
            </span>

            <h2 className="text-xl font-bold text-sky-400 mt-3">{reporteModal.titulo}</h2>
            <p className="text-xs text-slate-400 mt-1">
              📍 Macrodistrito: <strong className="text-slate-200 uppercase">{obtenerMacrodistrito(reporteModal)}</strong>
            </p>

            {/* FOTO */}
            <div className="mt-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-56 flex items-center justify-center relative">
              {(() => {
                const urlImagen = obtenerUrlImagen(reporteModal);
                return urlImagen ? (
                  <img 
                    src={urlImagen} 
                    alt="Evidencia del reporte" 
                    className="w-full h-full object-cover z-10"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null;
              })()}
              
              <div className="text-center p-4 text-slate-500 absolute inset-0 z-0 flex flex-col items-center justify-center">
                <span className="text-3xl block mb-1">📷</span>
                <p className="text-xs">Sin evidencia fotográfica</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <div>
                <span className="text-slate-400 text-xs">Nivel de Fiabilidad:</span>
                <p className="font-medium text-slate-200 capitalize">{reporteModal.nivel_fiabilidad || 'Confiable'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Descripción del problema:</span>
                <p className="text-slate-300 text-xs mt-0.5">{reporteModal.descripcion}</p>
              </div>
            </div>

            {/* CONTROL DE ESTADO MUNICIPAL (PARA EL ADMIN) */}
            <div className="mt-5 pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-400 mb-2 font-semibold">Cambiar Estado de Atención Municipal:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => cambiarEstado(reporteModal.id, 'pendiente')}
                  className="py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/40"
                >
                  🟡 Pendiente
                </button>
                <button
                  onClick={() => cambiarEstado(reporteModal.id, 'en_proceso')}
                  className="py-1.5 text-xs font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded border border-sky-500/40"
                >
                  🔵 En Proceso
                </button>
                <button
                  onClick={() => cambiarEstado(reporteModal.id, 'finalizado')}
                  className="py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded border border-emerald-500/40"
                >
                  🟢 Finalizado
                </button>
              </div>
            </div>

            <button 
              onClick={() => setReporteModal(null)}
              className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Cerrar Vista de Administración
            </button>

          </div>
        </div>
      )}

    </main>
  );
}