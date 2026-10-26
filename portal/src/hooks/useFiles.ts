import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FileFolder } from '../types/database';
import { listFiles, uploadFiles } from '../services/files';

export function useFiles(clientId: string | null | undefined) {
  return useQuery({
    queryKey: ['files', clientId],
    queryFn: () => listFiles(clientId!),
    enabled: !!clientId,
  });
}

export function useUploadFiles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, folder, files }: { clientId: string; folder: FileFolder; files: File[] }) =>
      uploadFiles(clientId, folder, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  });
}
