export const REPORT_CATEGORIES = ['Luminaria', 'Vialidad', 'Limpieza', 'Seguridad', 'Otros'] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
