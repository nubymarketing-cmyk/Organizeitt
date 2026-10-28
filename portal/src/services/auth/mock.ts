// Login por link mágico no modo demonstração.

import type { Profile } from '../../types/database';
import { AppError, currentProfile, setCurrentUser } from '../mock/access';
import { db, delay, resetMockDb } from '../mock/db';

export async function getSessionProfile(): Promise<Profile | null> {
  const p = currentProfile();
  return delay(p ? { ...p } : null, 50);
}

export async function sendMagicLink(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new AppError('Digite um e-mail válido.');
  // Não revela se o e-mail existe: a resposta é sempre "link enviado".
  await delay(null, 500);
}

/** Só no modo demonstração: simula o clique no link recebido por e-mail. */
export async function openMagicLinkDemo(email: string): Promise<Profile> {
  const p = db.profiles.find((x) => x.email === email.trim().toLowerCase());
  if (!p) throw new AppError('Nenhum convite encontrado para este e-mail.');
  setCurrentUser(p.id);
  return delay({ ...p }, 200);
}

export function listDemoUsers(): Profile[] {
  return db.profiles.map((p) => ({ ...p }));
}

export async function markTourDone(): Promise<void> {
  const p = currentProfile();
  if (p) p.tour_done_at = new Date().toISOString();
  await delay(null, 50);
}

const ONLY_SUPABASE = 'Disponível só com o Supabase ligado.';

export async function signInWithPassword(): Promise<void> {
  throw new AppError(ONLY_SUPABASE);
}

export async function signUpAgency(): Promise<{ signedIn: boolean }> {
  throw new AppError(ONLY_SUPABASE);
}

export async function setMyPassword(): Promise<void> {
  throw new AppError('Disponível só com o Supabase ligado.');
}

export async function signOut(): Promise<void> {
  setCurrentUser(null);
  await delay(null, 50);
}

/** Só no modo demonstração: restaura os dados de exemplo. */
export function resetDemo() {
  setCurrentUser(null);
  resetMockDb();
}
