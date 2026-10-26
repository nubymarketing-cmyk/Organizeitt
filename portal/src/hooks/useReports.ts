import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listReports, saveReport, unpublishReport, type ReportInput } from '../services/reports';

export function useReports(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['reports', clientId],
    queryFn: () => listReports(clientId!),
    enabled: !!clientId,
  });
}

export function useSaveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, publish, pdf }: { input: ReportInput; publish: boolean; pdf?: File | null }) =>
      saveReport(input, publish, pdf),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useUnpublishReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unpublishReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
