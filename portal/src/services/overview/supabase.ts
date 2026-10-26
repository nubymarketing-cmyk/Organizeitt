// Visão geral da agência no Supabase. As funções do banco rodam com o RLS de quem chama.

import type { ActivityEntry, UserRole } from '../../types/database';
import { supabase, unwrap } from '../supabase';
import type { ActivityWithNames, Overview } from './types';

export async function getOverview(): Promise<Overview> {
  return unwrap(await supabase().rpc('agency_overview')) as Overview;
}

type ActivityRow = ActivityEntry & {
  actor: { full_name: string; role: UserRole } | null;
  client: { name: string } | null;
};

export async function listActivity(limit = 30): Promise<ActivityWithNames[]> {
  const rows = unwrap(
    await supabase()
      .from('activity_log')
      .select('*, actor:profiles(full_name, role), client:clients(name)')
      .order('created_at', { ascending: false })
      .limit(limit),
  ) as ActivityRow[];
  return rows.map(({ actor, client, ...a }) => ({
    ...a,
    actor_name: actor?.full_name ?? 'Alguém',
    actor_role: actor?.role ?? null,
    client_name: client?.name ?? 'Cliente',
  }));
}
