import { useMemo, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import { useAgencyPosts, useReschedulePost } from '../../hooks/usePosts';
import { monthTitle } from '../../lib/format';
import type { PostWithClient } from '../../services/posts';
import { Card, EmptyState, ErrorState, InlineError, PageHeader, Select, SkeletonList, cx } from '../../components/ui';
import { AgencyPostRow } from '../../components/AgencyParts';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FALLBACK_COLOR = '#8B5CF6';

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Todos os clientes num calendário só, na cor de cada um. Arrastar muda a data (no computador). */
export function CalendarioGeralPage() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [clientId, setClientId] = useState('all');
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [dragOver, setDragOver] = useState<string | null>(null);

  const cells = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1 - cursor.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);
  const range = useMemo(() => {
    const end = new Date(cells[41]);
    end.setDate(end.getDate() + 1);
    return { from: cells[0].toISOString(), to: end.toISOString() };
  }, [cells]);

  const posts = useAgencyPosts(range);
  const undated = useAgencyPosts({ status: 'in_creation' });
  const clients = useClients();
  const move = useReschedulePost();

  const visible = (posts.data ?? []).filter((p) => clientId === 'all' || p.client_id === clientId);
  const byDay = useMemo(() => {
    const map = new Map<string, PostWithClient[]>();
    for (const p of visible) {
      if (!p.scheduled_at) continue;
      const k = dayKey(new Date(p.scheduled_at));
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return map;
  }, [visible]);
  const noDate = (undated.data ?? []).filter((p) => !p.scheduled_at && (clientId === 'all' || p.client_id === clientId));
  const allPosts = [...visible, ...noDate];
  const todayKey = dayKey(new Date());
  const dayPosts = byDay.get(selected) ?? [];

  const onDrop = (e: DragEvent, day: Date) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const post = allPosts.find((p) => p.id === id);
    if (!post) return;
    // Mantém o horário; post sem data entra às 10h.
    const old = post.scheduled_at ? new Date(post.scheduled_at) : null;
    const next = new Date(day);
    next.setHours(old?.getHours() ?? 10, old?.getMinutes() ?? 0, 0, 0);
    if (old && old.getTime() === next.getTime()) return;
    move.mutate({ id, scheduledAt: next.toISOString() });
  };

  const legend = (clients.data ?? []).filter((c) => clientId === 'all' || c.id === clientId);

  return (
    <div>
      <PageHeader title="Calendário" subtitle="Todos os clientes, cada um na sua cor. No computador, arraste o post para mudar a data." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button className="min-h-[44px] rounded-lg px-3 text-xl text-lilac" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Mês anterior">‹</button>
          <p className="min-w-[150px] text-center font-display font-bold text-white">{monthTitle(cursor)}</p>
          <button className="min-h-[44px] rounded-lg px-3 text-xl text-lilac" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Próximo mês">›</button>
        </div>
        <Select value={clientId} onChange={(e) => setClientId(e.target.value)} className="max-w-[220px] py-2 text-xs" aria-label="Filtrar por cliente">
          <option value="all">Todos os clientes</option>
          {(clients.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {legend.length ? (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color ?? FALLBACK_COLOR }} />
              {c.name}
            </span>
          ))}
        </div>
      ) : null}

      <InlineError error={move.error} />

      {posts.isLoading ? (
        <SkeletonList rows={4} />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : !clients.data?.length ? (
        <EmptyState title="Nenhum cliente ainda" text="Cadastre o primeiro cliente e os posts dele aparecem aqui." />
      ) : (
        <>
          <Card className="p-2 md:p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-dim">
              {WEEKDAYS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const k = dayKey(d);
                const list = byDay.get(k) ?? [];
                const inMonth = d.getMonth() === cursor.getMonth();
                return (
                  <div
                    key={k}
                    onClick={() => setSelected(k)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(k);
                    }}
                    onDragLeave={() => setDragOver((v) => (v === k ? null : v))}
                    onDrop={(e) => onDrop(e, d)}
                    className={cx(
                      'min-h-[52px] cursor-pointer rounded-lg border p-1 md:min-h-[96px]',
                      dragOver === k ? 'border-violet bg-violet/15' : selected === k ? 'border-violet/50 bg-white/[.04]' : 'border-transparent hover:bg-white/[.03]',
                    )}
                  >
                    <p className={cx('text-xs', inMonth ? 'text-white' : 'text-dim/50', k === todayKey && 'font-bold text-lilac')}>{d.getDate()}</p>
                    {/* Celular: bolinhas. Computador: cartões arrastáveis. */}
                    <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                      {list.slice(0, 4).map((p) => (
                        <span key={p.id} className="h-1.5 w-1.5 rounded-full" style={{ background: p.client_color ?? FALLBACK_COLOR }} />
                      ))}
                    </div>
                    <div className="mt-1 hidden space-y-1 md:block">
                      {list.slice(0, 3).map((p) => (
                        <PostChip key={p.id} post={p} />
                      ))}
                      {list.length > 3 ? <p className="text-[10px] text-dim">+{list.length - 3}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <section className="mt-5">
            <h2 className="mb-2 font-display text-base font-bold text-white">Posts do dia</h2>
            {dayPosts.length ? (
              <div className="space-y-2">
                {dayPosts.map((p) => (
                  <AgencyPostRow key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-dim">Nenhum post neste dia.</p>
            )}
          </section>

          {noDate.length ? (
            <section className="mt-6 hidden md:block">
              <h2 className="mb-2 font-display text-base font-bold text-white">Sem data</h2>
              <p className="mb-2 text-xs text-dim">Arraste para um dia do calendário para agendar.</p>
              <div className="flex flex-wrap gap-2">
                {noDate.map((p) => (
                  <div key={p.id} className="w-48">
                    <PostChip post={p} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function PostChip({ post }: { post: PostWithClient }) {
  return (
    <Link
      to={`/agencia/posts/${post.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', post.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => e.stopPropagation()}
      title={`${post.client_name}: ${post.title}`}
      className="block cursor-grab truncate rounded px-1.5 py-0.5 text-[11px] font-semibold text-white active:cursor-grabbing"
      style={{ background: `${post.client_color ?? FALLBACK_COLOR}55`, borderLeft: `3px solid ${post.client_color ?? FALLBACK_COLOR}` }}
    >
      {post.title}
    </Link>
  );
}
