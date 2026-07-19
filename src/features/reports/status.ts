import type { ReportStatus } from './types';

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; bgClassName: string; textClassName: string }
> = {
  pendiente: {
    label: 'Pendiente',
    bgClassName: 'bg-status-pending/10',
    textClassName: 'text-status-pending',
  },
  en_revision: {
    label: 'En Revisión',
    bgClassName: 'bg-status-review/10',
    textClassName: 'text-status-review',
  },
  resuelto: {
    label: 'Resuelto',
    bgClassName: 'bg-status-resolved/10',
    textClassName: 'text-status-resolved',
  },
};
