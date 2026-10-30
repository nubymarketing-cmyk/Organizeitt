// Clientes e convites no Supabase.
// Convite: a RPC invite_user registra a pessoa e devolve um código de acesso. Com e-mail + código
// ela cria a senha em "Primeiro acesso"; o banco cria o profile a partir do convite.

import type { Client, ClientCharge, Profile } from '../../types/database';
import { AppError } from '../errors';
import { supabase, unwrap } from '../supabase';
import type { ClientInput, ClientUser, ClientWithCounts, InviteInput, PaymentStatus } from './types';

/** numeric chega como texto do Postgres. */
function fromRow(c: Client): Client {
  return { ...c, monthly_fee: c.monthly_fee === null ? null : Number(c.monthly_fee) };
}

interface SummaryRow {
  client_id: string;
  month_published: number;
  month_planned: number;
  overdue: number;
  awaiting: number;
  changes: number;
  payment_status: PaymentStatus;
}

export async function listClients(): Promise<ClientWithCounts[]> {
  const db = supabase();
  const [clients, summary, profiles, invites] = await Promise.all([
    db.from('clients').select('*').eq('active', true).order('name'),
    db.rpc('clients_summary'),
    db.from('profiles').select('client_id, email').not('client_id', 'is', null),
    db.from('invitations').select('client_id, email').is('accepted_at', null).not('client_id', 'is', null),
  ]);
  const stats = new Map((unwrap(summary) as SummaryRow[]).map((r) => [r.client_id, r]));
  // Quem tem conta e código novo aparece nas duas listas: conta uma vez só.
  const profileRows = unwrap(profiles) as { client_id: string; email: string }[];
  const inviteRows = (unwrap(invites) as { client_id: string; email: string }[]).filter((i) => !profileRows.some((p) => p.email === i.email));
  const userRows = [...profileRows, ...inviteRows];
  return (unwrap(clients) as Client[])
    .map((c) => {
      const st = stats.get(c.id);
      return {
        ...fromRow(c),
        awaiting_count: Number(st?.awaiting ?? 0),
        changes_count: Number(st?.changes ?? 0),
        users_count: userRows.filter((x) => x.client_id === c.id).length,
        month_published: Number(st?.month_published ?? 0),
        month_planned: Number(st?.month_planned ?? 0),
        overdue_count: Number(st?.overdue ?? 0),
        payment_status: st?.payment_status ?? 'none',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function getClient(id: string): Promise<Client> {
  const row = unwrap(await supabase().from('clients').select('*').eq('id', id).maybeSingle()) as Client | null;
  if (!row) throw new AppError('Cliente não encontrado.');
  return fromRow(row);
}

/** Dados, cor e mensalidade do cliente. Só o admin. */
export async function updateClient(id: string, input: ClientInput): Promise<Client> {
  const row = unwrap(
    await supabase()
      .rpc('update_client', {
        p_client: id,
        p_name: input.name,
        p_specialty: input.specialty,
        p_contact_email: input.contact_email,
        p_color: input.color,
        p_monthly_fee: input.monthly_fee,
        p_billing_day: input.billing_day,
      })
      .single<Client>(),
  );
  return fromRow(row);
}

function chargeRow(c: ClientCharge): ClientCharge {
  return { ...c, amount: Number(c.amount) };
}

/** Mensalidades do cliente, a mais recente primeiro. Só o admin enxerga. */
export async function listCharges(clientId: string): Promise<ClientCharge[]> {
  const rows = unwrap(
    await supabase().from('client_charges').select('*').eq('client_id', clientId).order('due_date', { ascending: false }),
  ) as ClientCharge[];
  return rows.map(chargeRow);
}

export async function createCharge(clientId: string, dueDate: string, amount: number, notes: string): Promise<ClientCharge> {
  return chargeRow(
    unwrap(
      await supabase()
        .rpc('create_charge', { p_client: clientId, p_due_date: dueDate, p_amount: amount, p_notes: notes })
        .single<ClientCharge>(),
    ),
  );
}

export async function setChargePaid(id: string, paid: boolean): Promise<void> {
  unwrap(await supabase().rpc('set_charge_paid', { p_charge: id, p_paid: paid }));
}

export async function deleteCharge(id: string): Promise<void> {
  unwrap(await supabase().rpc('delete_charge', { p_charge: id }));
}

export async function createClient(input: { name: string; specialty: string; contact_email: string }): Promise<Client> {
  const created = unwrap(
    await supabase()
      .rpc('create_client', { p_name: input.name, p_specialty: input.specialty, p_contact_email: input.contact_email })
      .single<Client>(),
  );
  return fromRow(created);
}

/** Excluir = desativar (seção 11). */
export async function deactivateClient(id: string): Promise<void> {
  unwrap(await supabase().rpc('deactivate_client', { p_client: id }));
}

/** Usuários da clínica, incluindo convites que ainda não fizeram o primeiro acesso. */
export async function listClientUsers(clientId: string): Promise<ClientUser[]> {
  const db = supabase();
  const [profiles, invites] = await Promise.all([
    db.from('profiles').select('*').eq('client_id', clientId).order('full_name'),
    db.from('invitations').select('*').eq('client_id', clientId).is('accepted_at', null).order('full_name'),
  ]);
  const people = unwrap(profiles) as Profile[];
  const inviteRows = unwrap(invites) as (Profile & { access_code: string | null })[];
  const pending = inviteRows
    .filter((inv) => !people.some((p) => p.email === inv.email))
    .map(
      (inv): ClientUser => ({
        id: inv.id,
        created_at: inv.created_at,
        agency_id: inv.agency_id,
        client_id: inv.client_id,
        role: inv.role,
        full_name: inv.full_name,
        email: inv.email,
        tour_done_at: null,
        phone: null,
        pending: true,
        access_code: inv.access_code,
      }),
    );
  // Quem já tem conta mas recebeu código novo (redefinição de senha) mostra o código também.
  const active = people.map(
    (p): ClientUser => ({ ...p, pending: false, access_code: inviteRows.find((i) => i.email === p.email)?.access_code ?? null }),
  );
  return [...active, ...pending];
}

/**
 * Registra o convite e devolve o código de acesso. A agência manda o código para a pessoa
 * (WhatsApp, por exemplo), e ela cria a senha em "Primeiro acesso". Não depende de e-mail.
 */
export async function inviteUser(input: InviteInput): Promise<string> {
  return unwrap(
    await supabase().rpc('invite_user', {
      p_email: input.email.trim().toLowerCase(),
      p_full_name: input.full_name,
      p_role: input.role,
      p_client: input.client_id,
      p_assigned: input.role === 'agency_member' ? (input.assigned_client_ids ?? []) : [],
    }),
  ) as string;
}

/** Novo código de acesso para quem já tem conta (esqueceu a senha ou nunca criou). Só o admin. */
export async function resetUserAccess(profileId: string): Promise<string> {
  return unwrap(await supabase().rpc('reset_user_access', { p_profile: profileId })) as string;
}
