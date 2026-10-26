import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Profile } from '../types/database';
import { getSessionProfile, markTourDone, onAuthChange, openMagicLinkDemo, sendMagicLink, signOut } from '../services/auth';

export function useSession() {
  return useQuery({ queryKey: ['session'], queryFn: getSessionProfile, staleTime: Infinity });
}

/** Recarrega a sessão quando o link mágico é aberto ou a pessoa sai em outra aba. */
export function useAuthListener() {
  const qc = useQueryClient();
  useEffect(
    () =>
      onAuthChange(() => {
        qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
        qc.invalidateQueries({ queryKey: ['session'] });
      }),
    [qc],
  );
}

/** Marca o tour como visto e atualiza a sessão sem recarregar. */
export function useMarkTourDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markTourDone,
    onSuccess: () =>
      qc.setQueryData<Profile | null>(['session'], (p) => (p ? { ...p, tour_done_at: p.tour_done_at ?? new Date().toISOString() } : p)),
  });
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
