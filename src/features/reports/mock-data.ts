import type { Report } from './types';

// ponytail: hardcoded fixture until the reportes table exists in Supabase.
export const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    titulo: 'Luminaria fundida',
    descripcion:
      'Poste de luz apagado en la calle principal, cruce con Av. Reforma. Causa poca visibilidad por la noche.',
    categoria: 'Luminaria',
    estado: 'pendiente',
    ubicacion: 'Av. Reforma 222',
    distancia: 'A 120m de ti',
    fecha: 'Hace 2 días',
    votos: 24,
    lngLat: [-99.1332, 19.4326],
  },
  {
    id: '2',
    titulo: 'Bache profundo',
    descripcion:
      'Bache de gran tamaño que afecta el carril derecho. Varios autos han tenido que esquivarlo bruscamente.',
    categoria: 'Vialidad',
    estado: 'en_revision',
    ubicacion: 'Calle Roma 45',
    distancia: 'A 350m de ti',
    fecha: 'Hace 1 semana',
    votos: 56,
    lngLat: [-99.1652, 19.4276],
  },
  {
    id: '3',
    titulo: 'Juegos infantiles dañados',
    descripcion:
      'Columpios rotos en el parque central. Ya fueron reemplazados por el equipo de mantenimiento municipal.',
    categoria: 'Otros',
    estado: 'resuelto',
    ubicacion: 'Parque México',
    distancia: 'A 500m de ti',
    fecha: 'Hace 1 mes',
    votos: 112,
    lngLat: [-99.1719, 19.4118],
  },
];
