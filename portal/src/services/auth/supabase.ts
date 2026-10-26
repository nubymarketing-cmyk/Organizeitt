// Login por link mágico no Supabase. Sem cadastro aberto: o banco recusa e-mail sem convite.

import type { Profile } from '../../types/database';
import { AppError } from '../errors';
import { appUrl, supabase, unwrap } from '../supabase';

export async function getSessionProfile(): Promise<Profile | null> {
  const { data } = await supabase().auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return unwrap(await supabase().from('profiles').select('*').eq('id', user.id).maybeSingle()) as Profile | null;
}

export async function sendMagicLink(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new AppError('Digite um e-mail válido.');
  const { error } = await supabase().auth.signInWithOtp({
    email: clean,
    // shouldCreateUser: o convidado ainda não tem usuário no primeiro acesso;
    // quem não tem convite é barrado pelo gatilho do banco.
    options: { shouldCreateUser: true, emailRedirectTo: `${appUrl()}/login` },
  });
  // Não revela se o e-mail existe: só limite de envio e falta de conexão viram erro na tela.
  if (error?.status === 429) throw new AppError('Muitos pedidos seguidos. Espere alguns minutos e tente de novo.');
  if (error?.message === 'Failed to fetch') throw new AppError('Sem conexão com o servidor. Tente de novo.');
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut();
}

/** Avisa quando a sessão muda (link mágico aberto, token renovado, saída em outra aba). */
export function onAuthChange(callback: () => void): () => void {
  const { data } = supabase().auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') callback();
  });
  return () => data.subscription.unsubscribe();
}
