import { useQuery } from '@tanstack/react-query';
import type { StorageBucket } from '../types/database';
import { getSignedUrl } from '../services/storage';

/** URL temporária para exibir mídia. Renova antes de expirar. */
export function useSignedUrl(bucket: StorageBucket, path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', bucket, path],
    queryFn: () => getSignedUrl(bucket, path!),
    enabled: !!path,
    staleTime: 4 * 60 * 1000,
  });
}
