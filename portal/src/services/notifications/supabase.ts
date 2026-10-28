// Avisos dentro do portal. O envio por e-mail e WhatsApp é feito à parte, pelo serviço
// notify-dispatch, a partir da mesma notificação; as telas não sabem dos canais.

import type { AppNotification } from '../../types/database';
import { supabase, unwrap } from '../supabase';

export async function listNotifications(limit = 30): Promise<AppNotification[]> {
  return unwrap(
    await supabase().from('notifications').select('*').order('created_at', { ascending: false }).limit(limit),
  ) as AppNotification[];
}

/** Marca como lidos; sem ids, marca todos. */
export async function markNotificationsRead(ids?: string[]): Promise<void> {
  unwrap(await supabase().rpc('mark_notifications_read', { p_ids: ids ?? null }));
}

export async function updateMyPhone(phone: string): Promise<void> {
  unwrap(await supabase().rpc('update_my_phone', { p_phone: phone }));
}
