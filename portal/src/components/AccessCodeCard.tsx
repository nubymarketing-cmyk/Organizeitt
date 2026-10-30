import { useState } from 'react';
import { appUrl } from '../services/supabase';
import { Button } from './ui';

/** Código de acesso para a agência repassar à pessoa, com a mensagem pronta. */
export function AccessCodeCard({ name, email, code }: { name: string; email: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${appUrl()}/primeiro-acesso`;
  const message = `Olá, ${name.split(' ')[0]}! Seu acesso ao portal está pronto.\n\n1. Abra: ${link}\n2. E-mail: ${email}\n3. Código de acesso: ${code}\n\nDepois é só criar a sua senha. O código vale por 14 dias.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // sem acesso à área de transferência (endereço sem https): a pessoa copia o código na tela
      window.prompt('Copie a mensagem:', message);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-line bg-fg/[.03] p-4 text-center">
      <p className="text-sm text-muted">Código de acesso de {name}</p>
      <p className="select-all font-display text-3xl font-extrabold tracking-[0.2em] text-fg">{code}</p>
      <p className="text-xs text-dim">
        Mande para <span className="text-fg">{email}</span>. Com ele a pessoa cria a própria senha. Vale por 14 dias e só uma vez.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="block">
          <Button type="button" className="w-full">Enviar no WhatsApp</Button>
        </a>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void copy()}>
          {copied ? 'Mensagem copiada' : 'Copiar mensagem'}
        </Button>
      </div>
    </div>
  );
}
