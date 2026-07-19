import type { IconName } from '@/components/ui/icon';

import type { ReportCategory } from './constants';

export const CATEGORY_ICONS: Record<ReportCategory, IconName> = {
  Luminaria: 'lightbulb',
  Vialidad: 'add-road',
  Limpieza: 'delete',
  Seguridad: 'security',
  Otros: 'more-horiz',
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  Luminaria: '#996100',
  Vialidad: '#BA1A1A',
  Limpieza: '#006C49',
  Seguridad: '#004AC6',
  Otros: '#737686',
};
