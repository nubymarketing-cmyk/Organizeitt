import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useAuth';
import { useMarkNotificationsRead, useNotifications, useUpdateMyPhone } from '../hooks/useNotifications';
import { timeAgo } from '../lib/format';
import { Button, InlineError, Input, cx } from './ui';

/** Sino com os avisos da pessoa. Abrir um aviso marca como lido e leva até ele. */
export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const list = useNotifications();
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = (list.data ?? []).filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-fg/5 hover:text-fg"
        onClick={() => setOpen(!open)}
        aria-label={unread ? `Avisos, ${unread} não lidos` : 'Avisos'}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cx(
            'absolute z-50 mt-2 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold text-fg">Avisos</p>
            {unread ? (
              <button className="min-h-[32px] text-xs text-lilac" onClick={() => markRead.mutate(undefined)}>
                marcar todos como lidos
              </button>
            ) : null}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {!list.data?.length ? (
              <p className="px-4 py-6 text-center text-sm text-dim">Nenhum aviso por enquanto.</p>
            ) : (
              list.data.map((n) => (
                <button
                  key={n.id}
                  className={cx('block w-full border-b border-line px-4 py-3 text-left hover:bg-fg/[.04]', !n.read_at && 'bg-violet/10')}
                  onClick={() => {
                    if (!n.read_at) markRead.mutate([n.id]);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <p className="text-sm font-semibold text-fg">{n.title}</p>
                  {n.body ? <p className="text-xs text-muted">{n.body}</p> : null}
                  <p className="mt-0.5 text-[11px] text-dim">{timeAgo(n.created_at)}</p>
                </button>
              ))
            )}
          </div>
          <PhoneSetting />
        </div>
      ) : null}
    </div>
  );
}

/** Telefone para receber os mesmos avisos no WhatsApp. */
function PhoneSetting() {
  const { data: profile } = useSession();
  const save = useUpdateMyPhone();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone ?? '');

  if (!editing) {
    return (
      <button className="block min-h-[44px] w-full px-4 text-left text-xs text-lilac" onClick={() => setEditing(true)}>
        {profile?.phone ? `WhatsApp para avisos: ${profile.phone}` : 'Receber avisos também no WhatsApp'}
      </button>
    );
  }
  return (
    <form
      className="space-y-2 px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(phone, { onSuccess: () => setEditing(false) });
      }}
    >
      <Input type="tel" inputMode="tel" placeholder="(11) 99999-0000" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
      <InlineError error={save.error} />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={save.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
