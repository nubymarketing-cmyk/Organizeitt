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

/**
 * Entrar com o código de 6 dígitos que vem no mesmo e-mail do link.
 * Funciona em qualquer aparelho: não depende do endereço para onde o link aponta.
 */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const token = code.replace(/\D/g, '');
  if (token.length !== 6) throw new AppError('Digite os 6 números do código.');
  const { error } = await supabase().auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' });
  if (error?.status === 429) throw new AppError('Muitas tentativas seguidas. Espere alguns minutos e tente de novo.');
  if (error?.message === 'Failed to fetch') throw new AppError('Sem conexão com o servidor. Tente de novo.');
  if (error) throw new AppError('Código inválido ou vencido. Peça um novo link e use o código do e-mail mais recente.');
}

/** Tour do primeiro acesso visto (ou pulado). */
export async function markTourDone(): Promise<void> {
  unwrap(await supabase().rpc('mark_tour_done'));
}

/** Entrada com senha (equipe da agência). As clínicas entram pelo link no e-mail. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error?.status === 400) throw new AppError('E-mail ou senha incorretos. Sem senha? Use o link por e-mail.');
  if (error) throw new AppError(error.message === 'Failed to fetch' ? 'Sem conexão com o servidor. Tente de novo.' : error.message);
}

export interface SignUpResult {
  /** false: o Supabase pede confirmação por e-mail antes do primeiro acesso. */
  signedIn: boolean;
}

/** Cadastro de agência nova: o banco cria a agência (teste de 14 dias no Pro) e o admin. */
export async function signUpAgency(agencyName: string, email: string, password: string): Promise<SignUpResult> {
  const name = agencyName.trim();
  const clean = email.trim().toLowerCase();
  if (name.length < 2) throw new AppError('Informe o nome da agência.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new AppError('Digite um e-mail válido.');
  if (password.length < 8) throw new AppError('A senha precisa ter pelo menos 8 caracteres.');
  const { data, error } = await supabase().auth.signUp({
    email: clean,
    password,
    options: { data: { signup_agency_name: name }, emailRedirectTo: `${appUrl()}/login` },
  });
  if (error?.status === 429) throw new AppError('Muitos cadastros seguidos. Espere alguns minutos e tente de novo.');
  if (error) throw new AppError(error.message.includes('already') ? 'Este e-mail já tem conta. Entre pela tela de login.' : error.message);
  return { signedIn: !!data.session };
}

/** Cria ou troca a senha de quem já está logado (entrou pelo link do e-mail, por exemplo). */
export async function setMyPassword(password: string): Promise<void> {
  if (password.length < 8) throw new AppError('A senha precisa ter pelo menos 8 caracteres.');
  const { error } = await supabase().auth.updateUser({ password });
  if (error?.message.toLowerCase().includes('same')) throw new AppError('Essa já é a sua senha atual.');
  if (error) throw new AppError(error.message === 'Failed to fetch' ? 'Sem conexão com o servidor. Tente de novo.' : error.message);
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
