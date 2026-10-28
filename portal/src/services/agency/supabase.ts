// Agência no Supabase: marca (white label), equipe por cliente e painel do dono da plataforma.

import type { Agency, AgencyPlan, AgencyStatus, Profile } from '../../types/database';
import { AppError } from '../errors';
import { supabase, toAppError, unwrap } from '../supabase';
import type { BrandingInput, PlatformAgency, TeamMember } from './types';

export async function getAgency(id: string): Promise<Agency> {
  const row = unwrap(await supabase().from('agencies').select('*').eq('id', id).maybeSingle()) as Agency | null;
  if (!row) throw new AppError('Agência não encontrada.');
  return row;
}

export async function updateBranding(agencyId: string, input: BrandingInput): Promise<Agency> {
  const current = await getAgency(agencyId);
  let logoUrl = input.removeLogo ? null : current.logo_url;
  if (input.logo) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(input.logo.type)) {
      throw new AppError('O logo precisa ser PNG, JPG ou WEBP.');
    }
    if (input.logo.size > 2 * 1024 * 1024) throw new AppError('O logo passa de 2 MB.');
    const ext = input.logo.type.split('/')[1];
    const path = `${agencyId}/logo-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase().storage.from('agency-assets').upload(path, input.logo, { contentType: input.logo.type });
    if (error) throw toAppError(error);
    logoUrl = supabase().storage.from('agency-assets').getPublicUrl(path).data.publicUrl;
  }
  return unwrap(
    await supabase()
      .rpc('update_agency_branding', { p_name: input.name, p_logo_url: logoUrl, p_color: input.color })
      .single<Agency>(),
  );
}

export async function listTeam(): Promise<TeamMember[]> {
  const db = supabase();
  const [profiles, invites, assignments] = await Promise.all([
    db.from('profiles').select('*').is('client_id', null).order('full_name'),
    db.from('invitations').select('*').is('client_id', null).is('accepted_at', null).order('full_name'),
    db.from('client_assignments').select('client_id, profile_id'),
  ]);
  const links = unwrap(assignments) as { client_id: string; profile_id: string }[];
  const active = (unwrap(profiles) as Profile[]).map(
    (p): TeamMember => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      role: p.role,
      pending: false,
      client_ids: links.filter((l) => l.profile_id === p.id).map((l) => l.client_id),
    }),
  );
  const pending = (unwrap(invites) as (Profile & { assigned_client_ids: string[] })[]).map(
    (i): TeamMember => ({
      id: i.id,
      full_name: i.full_name,
      email: i.email,
      role: i.role,
      pending: true,
      client_ids: i.assigned_client_ids ?? [],
    }),
  );
  return [...active, ...pending];
}

export async function setMemberClients(profileId: string, clientIds: string[]): Promise<void> {
  unwrap(await supabase().rpc('set_member_clients', { p_profile: profileId, p_clients: clientIds }));
}

/** Onboarding concluído ou pulado. */
export async function completeOnboarding(): Promise<void> {
  unwrap(await supabase().rpc('complete_onboarding'));
}

export async function isPlatformAdmin(): Promise<boolean> {
  return !!unwrap(await supabase().rpc('is_platform_admin'));
}

export async function listPlatformAgencies(): Promise<PlatformAgency[]> {
  return unwrap(await supabase().rpc('platform_agencies')) as PlatformAgency[];
}

export async function platformUpdateAgency(id: string, plan: AgencyPlan, status: AgencyStatus): Promise<void> {
  unwrap(await supabase().rpc('platform_update_agency', { p_agency: id, p_plan: plan, p_status: status }));
}
