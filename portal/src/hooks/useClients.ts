import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClient,
  deactivateClient,
  getClient,
  inviteUser,
  listClients,
  listClientUsers,
  type InviteInput,
} from '../services/clients';

export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: listClients });
}

export function useClient(id: string | null | undefined) {
  return useQuery({ queryKey: ['client', id], queryFn: () => getClient(id!), enabled: !!id });
}

export function useClientUsers(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-users', clientId],
    queryFn: () => listClientUsers(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createClient, onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }) });
}

export function useDeactivateClient() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deactivateClient, onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }) });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteInput) => inviteUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-users'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
