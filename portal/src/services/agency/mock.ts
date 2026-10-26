// Agência no modo demonstração (congelado): só leitura.

import type { Agency } from '../../types/database';
import { AppError, requireProfile } from '../mock/access';
import { db, delay } from '../mock/db';
import type { PlatformAgency, TeamMember } from './types';

const ONLY_SUPABASE = 'Disponível só com o Supabase ligado.';

export async function getAgency(id: string): Promise<Agency> {
  const a = db.agencies.find((x) => x.id === id);
  if (!a) throw new AppError('Agência não encontrada.');
  return delay({ ...a });
}

export async function updateBranding(): Promise<Agency> {
  throw new AppError(ONLY_SUPABASE);
}

export async function listTeam(): Promise<TeamMember[]> {
  const p = requireProfile();
  return delay(
    db.profiles
      .filter((x) => x.agency_id === p.agency_id && !x.client_id)
      .map((x) => ({ id: x.id, full_name: x.full_name, email: x.email, role: x.role, pending: false, client_ids: [] })),
  );
}

export async function setMemberClients(): Promise<void> {
  throw new AppError(ONLY_SUPABASE);
}

export async function isPlatformAdmin(): Promise<boolean> {
  return false;
}

export async function listPlatformAgencies(): Promise<PlatformAgency[]> {
  throw new AppError(ONLY_SUPABASE);
}

export async function platformUpdateAgency(): Promise<void> {
  throw new AppError(ONLY_SUPABASE);
}
