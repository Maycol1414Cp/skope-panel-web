import { useQuery } from '@tanstack/react-query';

import { MOCK_REPORTS } from './mock-data';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    // TODO(supabase): reemplazar por supabase.from('reportes').select(...)
    queryFn: async () => MOCK_REPORTS,
  });
}
