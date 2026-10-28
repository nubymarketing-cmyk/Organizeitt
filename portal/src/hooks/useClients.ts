import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClient,
  deactivateClient,
  getClient,
  inviteUser,
  listClients,
  listClientUsers,
  updateClient,
  listCharges,
  createCharge,
  setChargePaid,
  deleteCharge,
  type ClientInput,
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

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClientInput }) => updateClient(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client'] });
      qc.invalidateQueries({ queryKey: ['agency-posts'] });
    },
  });
}

export function useCharges(clientId: string | undefined, enabled = true) {
  return useQuery({ queryKey: ['charges', clientId], queryFn: () => listCharges(clientId!), enabled: !!clientId && enabled });
}

/** Toda mudança de cobrança atualiza a lista, o card do cliente e os alertas. */
function useInvalidateCharges() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['charges'] });
    qc.invalidateQueries({ queryKey: ['clients'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };
}

export function useCreateCharge() {
  const invalidate = useInvalidateCharges();
  return useMutation({
    mutationFn: ({ clientId, dueDate, amount, notes }: { clientId: string; dueDate: string; amount: number; notes: string }) =>
      createCharge(clientId, dueDate, amount, notes),
    onSuccess: invalidate,
  });
}

export function useSetChargePaid() {
  const invalidate = useInvalidateCharges();
  return useMutation({
    mutationFn: ({ id, paid }: { id: string; paid: boolean }) => setChargePaid(id, paid),
    onSuccess: invalidate,
  });
}

export function useDeleteCharge() {
  const invalidate = useInvalidateCharges();
  return useMutation({ mutationFn: deleteCharge, onSuccess: invalidate });
}
