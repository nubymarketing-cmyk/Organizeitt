import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Profile } from '../types/database';
import { getSessionProfile, openMagicLinkDemo, sendMagicLink, signOut } from '../services/auth';

export function useSession() {
  return useQuery({ queryKey: ['session'], queryFn: getSessionProfile, staleTime: Infinity });
}

export function useSendMagicLink() {
  return useMutation({ mutationFn: sendMagicLink });
}

export function useOpenMagicLinkDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: openMagicLinkDemo,
    onSuccess: (profile) => resetSession(qc, profile),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => resetSession(qc, null),
  });
}

/** Troca de usuário: descarta dados do usuário anterior e atualiza a sessão em uso. */
function resetSession(qc: QueryClient, profile: Profile | null) {
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
  qc.setQueryData(['session'], profile);
}
