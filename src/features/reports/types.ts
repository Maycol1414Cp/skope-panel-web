import type { ReportCategory } from './constants';

export type ReportStatus = 'pendiente' | 'en_revision' | 'resuelto';

export type Report = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: ReportCategory;
  estado: ReportStatus;
  ubicacion: string;
  distancia?: string;
  fecha: string;
  votos: number;
  imagenUrl?: string;
  /** [longitud, latitud] — orden que espera MapLibre. */
  lngLat: [number, number];
};
