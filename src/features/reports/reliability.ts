import type { IconName } from '@/components/ui/icon';

export type ReliabilityLevel = 'sin_verificar' | 'confiable' | 'semi_confiable' | 'dudoso' | 'revision_manual';

// Mantener en sync con la tabla niveles_fiabilidad de schema-propuesto.sql —
// el trigger de la base es la fuente de verdad real, esto es solo la vista previa
// que se muestra ANTES de publicar (todavía no hay fila en reportes para triggerear).
const THRESHOLDS_M: { nombre: Exclude<ReliabilityLevel, 'sin_verificar'>; maxM: number | null }[] = [
  { nombre: 'confiable', maxM: 100 },
  { nombre: 'semi_confiable', maxM: 500 },
  { nombre: 'dudoso', maxM: 2000 },
  { nombre: 'revision_manual', maxM: null },
];

export function getReliabilityLevel(distanceKm: number | null): ReliabilityLevel {
  if (distanceKm === null) return 'sin_verificar';
  const distanceM = distanceKm * 1000;
  const match = THRESHOLDS_M.find((t) => t.maxM === null || distanceM <= t.maxM);
  return match!.nombre;
}

export const RELIABILITY_CONFIG: Record<
  ReliabilityLevel,
  { label: string; icon: IconName; bg: string; text: string; color: string }
> = {
  sin_verificar: {
    label: 'Sin verificar tu ubicación',
    icon: 'help-outline',
    bg: 'bg-neutral-200 dark:bg-neutral-800',
    text: 'text-neutral-500 dark:text-neutral-400',
    color: '#737686',
  },
  confiable: {
    label: 'Confiable — estás justo ahí',
    icon: 'verified',
    bg: 'bg-status-resolved/10',
    text: 'text-status-resolved',
    color: '#006C49',
  },
  semi_confiable: {
    label: 'Semi confiable — cerca del punto',
    icon: 'task-alt',
    bg: 'bg-primary/10',
    text: 'text-primary',
    color: '#004AC6',
  },
  dudoso: {
    label: 'Dudoso — bastante lejos del punto',
    icon: 'warning',
    bg: 'bg-warning/10',
    text: 'text-warning',
    color: '#996100',
  },
  revision_manual: {
    label: 'Se enviará a revisión manual',
    icon: 'flag',
    bg: 'bg-status-pending/10',
    text: 'text-status-pending',
    color: '#BA1A1A',
  },
};
