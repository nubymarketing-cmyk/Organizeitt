// WhatsApp por webhook genérico, para ligar o provedor escolhido (API oficial, Z-API etc.).
// Secrets: WHATSAPP_WEBHOOK_URL e WHATSAPP_TOKEN. O corpo enviado é { phone, message }.
// Se o provedor pedir outro formato, ajuste só este arquivo.
import type { Channel, OutboxMessage } from './types.ts';

const url = Deno.env.get('WHATSAPP_WEBHOOK_URL');
const token = Deno.env.get('WHATSAPP_TOKEN');

export const whatsapp: Channel = {
  configured: () => !!url,
  async send(m: OutboxMessage) {
    const message = [`*${m.subject}*`, m.body, m.url].filter(Boolean).join('\n\n');
    const res = await fetch(url!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ phone: m.recipient, message }),
    });
    if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
  },
};
