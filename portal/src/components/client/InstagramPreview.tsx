import { useState } from 'react';
import { MediaView, cx } from '../ui';
import { initials } from '../../lib/format';

/** Como o post vai aparecer no feed: perfil, arte, ícones e legenda. */
export function InstagramPreview({ clientName, media, caption }: { clientName: string; media: string[]; caption: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const idx = Math.min(i, Math.max(0, media.length - 1));
  const handle = clientName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-black">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
          {initials(clientName)}
        </span>
        <span className="text-sm font-semibold text-white">{handle || clientName}</span>
      </div>

      <div className="relative">
        {media.length ? (
          <MediaView key={media[idx]} path={media[idx]} className="aspect-square w-full" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-dim">a arte aparece aqui</div>
        )}
        {media.length > 1 ? (
          <>
            <button
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white disabled:opacity-0"
              onClick={() => setI(Math.max(0, idx - 1))}
              disabled={idx === 0}
              aria-label="Imagem anterior"
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white disabled:opacity-0"
              onClick={() => setI(Math.min(media.length - 1, idx + 1))}
              disabled={idx === media.length - 1}
              aria-label="Próxima imagem"
            >
              ›
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
              {idx + 1}/{media.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex gap-4 px-3 pt-3 text-white" aria-hidden>
        <Icon d="M12 21s-7-4.4-9.3-8.6C1 9.2 2.6 5.5 6.2 5.1c2-.2 3.8 1 4.8 2.6 1-1.6 2.8-2.8 4.8-2.6 3.6.4 5.2 4.1 3.5 7.3C19 16.6 12 21 12 21z" />
        <Icon d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-5A8.5 8.5 0 1 1 21 11.5z" />
        <Icon d="M22 3 11 14M22 3l-7 19-4-8-8-4 19-7z" />
      </div>
      {media.length > 1 ? (
        <div className="flex justify-center gap-1 pt-2">
          {media.map((m, k) => (
            <span key={m} className={cx('h-1.5 w-1.5 rounded-full', k === idx ? 'bg-azure' : 'bg-white/30')} />
          ))}
        </div>
      ) : null}

      <div className="px-3 pb-4 pt-2 text-sm leading-relaxed text-white">
        <span className="font-semibold">{handle || clientName} </span>
        <span className={cx('whitespace-pre-line', !open && 'line-clamp-3')}>{caption || 'sem legenda'}</span>
        {caption.length > 140 ? (
          <button className="ml-1 min-h-[32px] text-muted" onClick={() => setOpen(!open)}>
            {open ? 'mostrar menos' : 'mais'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
