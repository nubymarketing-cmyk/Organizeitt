// Serviço de envio das notificações: lê a fila notification_outbox e manda por canal.
// Rodar de minuto em minuto (pg_cron + pg_net, ou agendador do Supabase).
// Secrets: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (automáticos), APP_URL e os de cada canal.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { email } from './channels/email.ts';
import { whatsapp } from './channels/whatsapp.ts';
import type { Channel, OutboxMessage } from './channels/types.ts';

const CHANNELS: Record<OutboxMessage['channel'], Channel> = { email, whatsapp };
const MAX_ATTEMPTS = 5;
const BATCH = 50;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');

Deno.serve(async () => {
  const { data: rows, error } = await db
    .from('notification_outbox')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(BATCH);
  if (error) return new Response(error.message, { status: 500 });

  const result = { sent: 0, failed: 0, skipped: 0 };
  for (const row of rows ?? []) {
    const channel = CHANNELS[row.channel as OutboxMessage['channel']];
    if (!channel?.configured()) {
      await db.from('notification_outbox').update({ status: 'skipped', last_error: 'canal não configurado' }).eq('id', row.id);
      result.skipped++;
      continue;
    }
    try {
      await channel.send({
        id: row.id,
        channel: row.channel,
        recipient: row.recipient,
        subject: row.subject,
        body: row.body,
        url: row.link && appUrl ? appUrl + row.link : null,
      });
      await db.from('notification_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq('id', row.id);
      result.sent++;
    } catch (e) {
      const attempts = row.attempts + 1;
      await db
        .from('notification_outbox')
        .update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', attempts, last_error: String(e).slice(0, 500) })
        .eq('id', row.id);
      result.failed++;
    }
  }
  return Response.json(result);
});
