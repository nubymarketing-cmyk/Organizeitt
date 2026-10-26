// Clientes e convites no Supabase.
// Convite: a RPC invite_user registra a pessoa e o link de acesso vai por e-mail
// (signInWithOtp). No primeiro login o banco cria o profile a partir do convite.

import type { Client, Profile } from '../../types/database';
import { AppError } from '../errors';
import { appUrl, supabase, unwrap } from '../supabase';
import type { ClientWithCounts, InviteInput } from './types';

export async function listClients(): Promise<ClientWithCounts[]> {
  const db = supabase();
  const [clients, posts, profiles, invites] = await Promise.all([
    db.from('clients').select('*').eq('active', true).order('name'),
    db.from('posts').select('client_id, status').in('status', ['awaiting_approval', 'changes_requested']),
    db.from('profiles').select('client_id').not('client_id', 'is', null),
    db.from('invitations').select('client_id').is('accepted_at', null).not('client_id', 'is', null),
  ]);
  const postRows = unwrap(posts) as { client_id: string; status: string }[];
  const userRows = [...(unwrap(profiles) as { client_id: string }[]), ...(unwrap(invites) as { client_id: string }[])];
  return (unwrap(clients) as Client[])
    .map((c) => ({
      ...c,
      awaiting_count: postRows.filter((x) => x.client_id === c.id && x.status === 'awaiting_approval').length,
      changes_count: postRows.filter((x) => x.client_id === c.id && x.status === 'changes_requested').length,
      users_count: userRows.filter((x) => x.client_id === c.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function getClient(id: string): Promise<Client> {
  const row = unwrap(await supabase().from('clients').select('*').eq('id', id).maybeSingle()) as Client | null;
  if (!row) throw new AppError('Cliente não encontrado.');
  return row;
}

export async function createClient(input: { name: string; specialty: string; contact_email: string }): Promise<Client> {
  return unwrap(
    await supabase()
      .rpc('create_client', { p_name: input.name, p_specialty: input.specialty, p_contact_email: input.contact_email })
      .single<Client>(),
  );
}

/** Excluir = desativar (seção 11). */
export async function deactivateClient(id: string): Promise<void> {
  unwrap(await supabase().rpc('deactivate_client', { p_client: id }));
}

/** Usuários da clínica, incluindo convites que ainda não fizeram o primeiro login. */
export async function listClientUsers(clientId: string): Promise<Profile[]> {
  const db = supabase();
  const [profiles, invites] = await Promise.all([
    db.from('profiles').select('*').eq('client_id', clientId).order('full_name'),
    db.from('invitations').select('*').eq('client_id', clientId).is('accepted_at', null).order('full_name'),
  ]);
  const pending = (unwrap(invites) as Profile[]).map(
    (inv): Profile => ({
      id: inv.id,
      created_at: inv.created_at,
      agency_id: inv.agency_id,
      client_id: inv.client_id,
      role: inv.role,
      full_name: inv.full_name,
      email: `${inv.email} · convite pendente`,
      tour_done_at: null,
    }),
  );
  return [...(unwrap(profiles) as Profile[]), ...pending];
}

export async function inviteUser(input: InviteInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  unwrap(
    await supabase().rpc('invite_user', {
      p_email: email,
      p_full_name: input.full_name,
      p_role: input.role,
      p_client: input.client_id,
      p_assigned: input.role === 'agency_member' ? (input.assigned_client_ids ?? []) : [],
    }),
  );
  const { error } = await supabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${appUrl()}/login` },
  });
  if (error) {
    throw new AppError(
      `Convite registrado, mas o e-mail não saiu (${error.message}). A pessoa pode entrar pela tela de login com este e-mail.`,
    );
  }
}
