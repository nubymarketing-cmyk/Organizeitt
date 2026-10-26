// Imita as regras de RLS da seção 6 enquanto não há banco.
// Com o Supabase, estas checagens passam a ser feitas pelo Postgres; aqui elas
// existem só para a interface se comportar igual desde já.

import type { Profile } from '../../types/database';
import { db } from './db';

const SESSION_KEY = 'nuby_mock_session';

export class AppError extends Error {}

let currentUserId: string | null = readStoredSession();

function readStoredSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setCurrentUser(id: string | null) {
  currentUserId = id;
  try {
    if (id) window.localStorage.setItem(SESSION_KEY, id);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // sem storage (aba anônima): a sessão vale só até recarregar
  }
}

export function currentProfile(): Profile | null {
  if (!currentUserId) return null;
  return db.profiles.find((p) => p.id === currentUserId) ?? null;
}

export function requireProfile(): Profile {
  const p = currentProfile();
  if (!p) throw new AppError('Sua sessão expirou. Entre novamente.');
  return p;
}

export function isStaff(p: Profile): boolean {
  return p.role === 'agency_admin' || p.role === 'agency_member';
}

export function requireStaff(): Profile {
  const p = requireProfile();
  if (!isStaff(p)) throw new AppError('Só a equipe da agência pode fazer isso.');
  return p;
}

export function requireClientUser(): Profile {
  const p = requireProfile();
  if (isStaff(p) || !p.client_id) throw new AppError('Só o cliente pode fazer isso.');
  return p;
}

/** Linha visível para o usuário? (agency_id e client_id, como no RLS) */
export function canSeeRow(p: Profile, row: { agency_id: string; client_id: string }): boolean {
  if (row.agency_id !== p.agency_id) return false;
  if (isStaff(p)) return true;
  return row.client_id === p.client_id;
}

export function assertClientAccess(p: Profile, clientId: string) {
  const client = db.clients.find((c) => c.id === clientId);
  if (!client || !canSeeRow(p, { agency_id: client.agency_id, client_id: client.id })) {
    throw new AppError('Cliente não encontrado.');
  }
  return client;
}

export function profileName(id: string): string {
  return db.profiles.find((p) => p.id === id)?.full_name ?? 'Usuário';
}
