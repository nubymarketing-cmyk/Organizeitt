import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AgencyPlan, AgencyStatus } from '../types/database';
import {
  getAgency,
  isPlatformAdmin,
  listPlatformAgencies,
  listTeam,
  platformUpdateAgency,
  setMemberClients,
  updateBranding,
  type BrandingInput,
} from '../services/agency';
import { useSession } from './useAuth';

/** Agência de quem está logado (nome, logo, cor, plano). */
export function useMyAgency() {
  const { data: profile } = useSession();
  const id = profile?.agency_id;
  return useQuery({ queryKey: ['agency', id], queryFn: () => getAgency(id!), enabled: !!id, staleTime: 5 * 60 * 1000 });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  const { data: profile } = useSession();
  return useMutation({
    mutationFn: (input: BrandingInput) => updateBranding(profile!.agency_id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency'] }),
  });
}

export function useTeam() {
  return useQuery({ queryKey: ['team'], queryFn: listTeam });
}

export function useSetMemberClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, clientIds }: { profileId: string; clientIds: string[] }) => setMemberClients(profileId, clientIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useIsPlatformAdmin() {
  const { data: profile } = useSession();
  return useQuery({ queryKey: ['platform-admin', profile?.id], queryFn: isPlatformAdmin, enabled: !!profile, staleTime: Infinity });
}

export function usePlatformAgencies() {
  return useQuery({ queryKey: ['platform-agencies'], queryFn: listPlatformAgencies });
}

export function usePlatformUpdateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan, status }: { id: string; plan: AgencyPlan; status: AgencyStatus }) => platformUpdateAgency(id, plan, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-agencies'] }),
  });
}
