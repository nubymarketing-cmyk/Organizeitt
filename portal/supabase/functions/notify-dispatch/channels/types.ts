/** Uma mensagem da fila notification_outbox, pronta para um canal enviar. */
export interface OutboxMessage {
  id: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  subject: string;
  body: string;
  /** URL completa do portal (APP_URL + caminho). */
  url: string | null;
}

/**
 * Canal de envio. Para ligar um provedor novo, crie um arquivo nesta pasta
 * e registre em index.ts. As telas e o banco não mudam.
 */
export interface Channel {
  /** false: canal sem configuração; a mensagem vira "skipped". */
  configured(): boolean;
  send(message: OutboxMessage): Promise<void>;
}
