import { useState } from 'react';
import type { PostVersion } from '../types/database';
import type { CommentWithAuthor } from '../services/posts';
import { useAddComment } from '../hooks/usePosts';
import { COMMENT_KIND_LABEL, formatDateTime } from '../lib/format';
import { Button, Card, InlineError, MediaView, Textarea, cx } from './ui';

/** Mídia da versão em carrossel simples (setas + bolinhas). */
export function MediaCarousel({ media }: { media: string[] }) {
  const [i, setI] = useState(0);
  if (!media.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-line text-sm text-dim">
        sem mídia nesta versão
      </div>
    );
  }
  const idx = Math.min(i, media.length - 1);
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <MediaView key={media[idx]} path={media[idx]} className="aspect-[4/5] w-full" />
        {media.length > 1 ? (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-xl text-fg disabled:opacity-30"
              onClick={() => setI(Math.max(0, idx - 1))}
              disabled={idx === 0}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-xl text-fg disabled:opacity-30"
              onClick={() => setI(Math.min(media.length - 1, idx + 1))}
              disabled={idx === media.length - 1}
              aria-label="Próxima"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {media.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {media.map((m, n) => (
            <span key={m} className={cx('h-1.5 rounded-full transition-all', n === idx ? 'w-5 bg-lilac' : 'w-1.5 bg-fg/20')} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VersionHistory({ versions, current }: { versions: PostVersion[]; current: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const older = versions.filter((v) => v.version_number !== current);
  if (!older.length) return null;
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-bold text-fg">Versões anteriores</h2>
      <div className="space-y-2">
        {older.map((v) => (
          <Card key={v.id} className="py-3">
            <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === v.version_number ? null : v.version_number)}>
              <span className="font-semibold text-fg">Versão {v.version_number}</span>
              <span className="text-xs text-muted">{formatDateTime(v.created_at)}</span>
            </button>
            {open === v.version_number ? (
              <div className="mt-3 space-y-3">
                {v.media.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {v.media.map((m) => (
                      <MediaView key={m} path={m} className="aspect-square w-full rounded-lg" />
                    ))}
                  </div>
                ) : null}
                <p className="whitespace-pre-line text-sm text-muted">{v.caption || 'sem legenda'}</p>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

export function CommentThread({ postId, comments }: { postId: string; comments: CommentWithAuthor[] }) {
  const [body, setBody] = useState('');
  const add = useAddComment();
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-bold text-fg">Conversa</h2>
      <div className="space-y-2">
        {comments.length === 0 ? <p className="text-sm text-dim">Nenhum comentário ainda.</p> : null}
        {comments.map((c) => (
          <div
            key={c.id}
            className={cx(
              'rounded-2xl border px-3.5 py-2.5',
              c.kind === 'change_request' ? 'border-bad/30 bg-bad/10' : c.kind === 'approval' ? 'border-ok/30 bg-ok/10' : 'border-line bg-card',
            )}
          >
            <p className="text-xs text-muted">
              <span className="font-semibold text-fg">{c.author_name}</span>
              {c.author_is_staff ? ' · equipe' : ''} {c.kind !== 'comment' ? COMMENT_KIND_LABEL[c.kind] : ''} · {formatDateTime(c.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-fg">{c.body}</p>
          </div>
        ))}
      </div>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate({ postId, body }, { onSuccess: () => setBody('') });
        }}
      >
        <Textarea placeholder="Escreva um comentário" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[70px]" />
        <InlineError error={add.error} />
        <Button type="submit" variant="secondary" loading={add.isPending} disabled={!body.trim()}>
          Comentar
        </Button>
      </form>
    </section>
  );
}
