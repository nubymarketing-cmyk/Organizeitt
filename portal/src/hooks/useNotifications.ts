import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markNotificationsRead, updateMyPhone } from '../services/notifications';
import { useSession } from './useAuth';

/** Avisos da pessoa logada. Confere de novo a cada minuto. */
export function useNotifications() {
  const { data: profile } = useSession();
  return useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: () => listNotifications(30),
    enabled: !!profile,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useUpdateMyPhone() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: updateMyPhone, onSuccess: () => qc.invalidateQueries({ queryKey: ['session'] }) });
}
