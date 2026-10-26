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

export async function signOut(): Promise<void> {
  setCurrentUser(null);
  await delay(null, 50);
}

/** Só no modo demonstração: restaura os dados de exemplo. */
export function resetDemo() {
  setCurrentUser(null);
  resetMockDb();
}
