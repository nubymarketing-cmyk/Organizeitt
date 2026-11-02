// Cliente do Supabase, criado só quando o portal não está em modo demonstração.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      // Link mágico com token na URL: funciona mesmo aberto em outro navegador,
      // o que o convite precisa (quem dispara o e-mail é o admin, não o convidado).
      auth: { flowType: 'implicit', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

interface Result<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/** Devolve os dados ou lança AppError com a mensagem do banco (as RPCs já falam português). */
export function unwrap<T>({ data, error }: Result<T>): T {
  if (error) throw toAppError(error);
  return data as T;
}

export function toAppError(error: { message: string; code?: string }): AppError {
  if (error.message === 'Failed to fetch') return new AppError('Sem conexão com o servidor. Tente de novo.');
  if (error.message.includes('row-level security')) return new AppError('Sem permissão para isso.');
  if (error.message.includes('maximum allowed size')) return new AppError('Arquivo maior que o limite permitido.');
  if (error.code === 'PGRST116') return new AppError('Não encontrado.');
  return new AppError(error.message);
}

/** URL pública do portal, usada nos links mágicos. */
export function appUrl(): string {
  return (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/$/, '');
}

/** agency_id do cliente, para montar o caminho do arquivo no Storage. */
export async function clientAgencyId(clientId: string): Promise<string> {
  const row = unwrap(await supabase().from('clients').select('agency_id').eq('id', clientId).maybeSingle()) as {
    agency_id: string;
  } | null;
  if (!row) throw new AppError('Cliente não encontrado.');
  return row.agency_id;
}
