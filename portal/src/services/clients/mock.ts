// Clientes da agência e convite de usuários no modo demonstração.

import type { Client, ClientCharge, Profile } from '../../types/database';
import { AppError, assertClientAccess, requireProfile, requireStaff } from '../mock/access';
import { db, delay, nowIso, uid } from '../mock/db';
import type { ClientWithCounts, InviteInput } from './types';

export async function listClients(): Promise<ClientWithCounts[]> {
  const p = requireStaff();
  const rows = db.clients
    .filter((c) => c.agency_id === p.agency_id && c.active)
    .map((c) => ({
      ...c,
      awaiting_count: db.posts.filter((x) => x.client_id === c.id && x.status === 'awaiting_approval').length,
      changes_count: db.posts.filter((x) => x.client_id === c.id && x.status === 'changes_requested').length,
      users_count: db.profiles.filter((x) => x.client_id === c.id).length,
      ...monthNumbers(c.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return delay(rows);
}

/** Números do mês para o card do cliente (mesma regra de clients_summary no banco). */
function monthNumbers(clientId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const posts = db.posts.filter((x) => x.client_id === clientId && x.scheduled_at);
  const inMonth = posts.filter((x) => x.scheduled_at! >= start && x.scheduled_at! < end);
  return {
    month_published: inMonth.filter((x) => x.status === 'published').length,
    month_planned: inMonth.length,
    overdue_count: posts.filter((x) => x.scheduled_at! < now.toISOString() && x.status !== 'published').length,
    payment_status: 'none' as const,
  };
}

export async function getClient(id: string): Promise<Client> {
  const p = requireProfile();
  return delay({ ...assertClientAccess(p, id) });
}

export async function createClient(input: { name: string; specialty: string; contact_email: string }): Promise<Client> {
  const p = requireStaff();
  if (input.name.trim().length < 2) throw new AppError('Informe o nome da clínica.');
  const client: Client = {
    id: uid(),
    created_at: nowIso(),
    agency_id: p.agency_id,
    name: input.name.trim(),
    specialty: input.specialty.trim() || null,
    contact_email: input.contact_email.trim() || null,
    active: true,
    color: null,
    monthly_fee: null,
    billing_day: null,
  };
  db.clients.push(client);
  return delay({ ...client });
}

/** Excluir = desativar (seção 11). */
export async function deactivateClient(id: string): Promise<void> {
  const p = requireStaff();
  const client = assertClientAccess(p, id);
  client.active = false;
  await delay(null);
}

export async function listClientUsers(clientId: string): Promise<Profile[]> {
  const p = requireStaff();
  assertClientAccess(p, clientId);
  return delay(db.profiles.filter((x) => x.client_id === clientId).map((x) => ({ ...x })));
}

export async function inviteUser(input: InviteInput): Promise<void> {
  const p = requireStaff();
  if (p.role !== 'agency_admin') throw new AppError('Só o admin da agência pode convidar usuários.');
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AppError('E-mail inválido.');
  if (!input.full_name.trim()) throw new AppError('Informe o nome da pessoa.');
  const clientRole = input.role === 'client_owner' || input.role === 'client_member';
  if (clientRole && !input.client_id) throw new AppError('Escolha a clínica deste usuário.');
  if (!clientRole && input.client_id) throw new AppError('Equipe da agência não fica ligada a uma clínica.');
  if (input.client_id) assertClientAccess(p, input.client_id);
  if (db.profiles.some((x) => x.email === email)) throw new AppError('Já existe um usuário com este e-mail.');
  db.profiles.push({
    id: uid(),
    created_at: nowIso(),
    agency_id: p.agency_id,
    client_id: clientRole ? input.client_id : null,
    role: input.role,
    full_name: input.full_name.trim(),
    email,
    tour_done_at: null,
    phone: null,
  });
  await delay(null, 500);
}

const ONLY_SUPABASE = 'Disponível só com o Supabase ligado.';

export async function updateClient(): Promise<Client> {
  throw new AppError(ONLY_SUPABASE);
}

export async function listCharges(): Promise<ClientCharge[]> {
  return delay([]);
}

export async function createCharge(): Promise<ClientCharge> {
  throw new AppError(ONLY_SUPABASE);
}

export async function setChargePaid(): Promise<void> {
  throw new AppError(ONLY_SUPABASE);
}

export async function deleteCharge(): Promise<void> {
  throw new AppError(ONLY_SUPABASE);
}
