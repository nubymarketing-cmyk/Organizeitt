// E-mail pelo Resend (https://resend.com). Secrets: RESEND_API_KEY e EMAIL_FROM.
import type { Channel, OutboxMessage } from './types.ts';

const apiKey = Deno.env.get('RESEND_API_KEY');
const from = Deno.env.get('EMAIL_FROM');

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export const email: Channel = {
  configured: () => !!apiKey && !!from,
  async send(m: OutboxMessage) {
    const button = m.url
      ? `<p><a href="${escape(m.url)}" style="background:#8B5CF6;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Abrir o portal</a></p>`
      : '';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: m.recipient,
        subject: m.subject,
        html: `<p>${escape(m.body)}</p>${button}`,
        text: m.url ? `${m.body}\n\n${m.url}` : m.body,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  },
};
