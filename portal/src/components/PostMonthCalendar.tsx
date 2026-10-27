import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Network, PostStatus } from '../types/database';
import { STATUS_LABEL, monthTitle } from '../lib/format';
import { Icon, NetworkIcon } from './icons';
import { Button, Card, StatusChip, cx } from './ui';

export interface CalendarPost {
  id: string;
  title: string;
  status: PostStatus;
  network: Network;
  scheduled_at: string | null;
  client_name?: string;
  client_color?: string | null;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const FALLBACK = '#0E7C6B';

/** Fundo e borda do chip por status (tokens do tema). */
const STATUS_CHIP: Record<PostStatus, string> = {
  in_creation: 'bg-fg/[.06] border-l-dim text-fg',
  awaiting_approval: 'bg-warn/10 border-l-warn text-fg',
  changes_requested: 'bg-bad/10 border-l-bad text-fg',
  approved: 'bg-info/10 border-l-info text-fg',
  published: 'bg-ok/10 border-l-ok text-fg',
};
const STATUS_BG: Record<PostStatus, string> = {
  in_creation: 'bg-dim',
  awaiting_approval: 'bg-warn',
  changes_requested: 'bg-bad',
  approved: 'bg-info',
  published: 'bg-ok',
};

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 42 dias (6 semanas) a partir do domingo antes do dia 1. */
export function monthCells(cursor: Date): Date[] {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  start.setDate(1 - start.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Intervalo em ISO coberto pela grade do mês, para buscar os posts. */
export function monthRange(cursor: Date) {
  const cells = monthCells(cursor);
  const end = new Date(cells[41]);
  end.setDate(end.getDate() + 1);
  return { from: cells[0].toISOString(), to: end.toISOString() };
}

/**
 * Calendário do mês com painel lateral do dia escolhido.
 * colorBy "status" (página do cliente) ou "client" (Agenda com todos os clientes).
 */
export function PostMonthCalendar({
  cursor,
  onCursor,
  posts,
  colorBy,
  linkTo,
  onCreate,
  onMove,
  panelExtra,
}: {
  cursor: Date;
  onCursor: (d: Date) => void;
  posts: CalendarPost[];
  colorBy: 'status' | 'client';
  linkTo: (p: CalendarPost) => string;
  /** Criar post no dia (YYYY-MM-DD). Sem isso, não aparece o "+". */
  onCreate?: (day: string) => void;
  /** Arrastar para outro dia (só no computador). */
  onMove?: (p: CalendarPost, day: Date) => void;
  /** Conteúdo extra no painel do dia (ex.: escolher o cliente). */
  panelExtra?: (day: string) => ReactNode;
}) {
  const today = dayKey(new Date());
  const [selected, setSelected] = useState(today);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const cells = useMemo(() => monthCells(cursor), [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const p of posts) {
      if (!p.scheduled_at) continue;
      const k = dayKey(new Date(p.scheduled_at));
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    for (const list of map.values()) list.sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''));
    return map;
  }, [posts]);

  const shift = (n: number) => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const goToday = () => {
    const d = new Date();
    onCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  };

  const drop = (e: DragEvent, day: Date) => {
    e.preventDefault();
    setDragOver(null);
    const post = posts.find((p) => p.id === e.dataTransfer.getData('text/plain'));
    if (post && onMove) onMove(post, day);
  };

  const dayPosts = byDay.get(selected) ?? [];
  const [sy, sm, sd] = selected.split('-').map(Number);
  const selectedDate = new Date(sy, sm - 1, sd);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg" onClick={() => shift(-1)} aria-label="Mês anterior">
              <Icon name="chevronLeft" />
            </button>
            <h2 className="min-w-[150px] text-center font-display text-base font-bold text-fg">{monthTitle(cursor)}</h2>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg" onClick={() => shift(1)} aria-label="Próximo mês">
              <Icon name="chevronRight" />
            </button>
          </div>
          <Button variant="secondary" className="min-h-[36px] px-3 py-1.5" onClick={goToday}>
            Hoje
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-surface-2 py-2 text-center text-xs font-semibold text-muted">
              {w}
            </div>
          ))}
          {cells.map((d) => {
            const k = dayKey(d);
            const list = byDay.get(k) ?? [];
            const inMonth = d.getMonth() === cursor.getMonth();
            const isSelected = selected === k;
            return (
              <div
                key={k}
                role="button"
                tabIndex={0}
                aria-label={`${d.getDate()} de ${monthTitle(d)}, ${list.length} post${list.length === 1 ? '' : 's'}`}
                aria-pressed={isSelected}
                onClick={() => setSelected(k)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(k)}
                onDragOver={onMove ? (e) => (e.preventDefault(), setDragOver(k)) : undefined}
                onDragLeave={onMove ? () => setDragOver((v) => (v === k ? null : v)) : undefined}
                onDrop={onMove ? (e) => drop(e, d) : undefined}
                className={cx(
                  'group relative min-h-[56px] cursor-pointer p-1.5 text-left outline-none transition md:min-h-[108px]',
                  inMonth ? 'bg-surface' : 'bg-surface-2/60',
                  isSelected && 'ring-2 ring-inset ring-brand',
                  dragOver === k && 'bg-brand/10',
                  'hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cx(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      k === today ? 'bg-brand font-semibold text-brand-fg' : inMonth ? 'text-fg' : 'text-dim',
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {onCreate ? (
                    <button
                      className="hidden h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-brand/10 hover:text-link group-hover:opacity-100 md:flex"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreate(k);
                      }}
                      aria-label={`Criar post em ${d.getDate()}`}
                      title="Criar post neste dia"
                    >
                      <Icon name="plus" className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {/* Celular: bolinhas */}
                <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                  {list.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      className={cx('h-1.5 w-1.5 rounded-full', colorBy === 'status' && STATUS_BG[p.status])}
                      style={colorBy === 'client' ? { background: p.client_color ?? FALLBACK } : undefined}
                    />
                  ))}
                </div>

                {/* Computador: chips */}
                <div className="mt-1 hidden space-y-1 md:block">
                  {list.slice(0, 3).map((p) => (
                    <PostChip key={p.id} post={p} colorBy={colorBy} to={linkTo(p)} draggable={!!onMove} />
                  ))}
                  {list.length > 3 ? <p className="px-1 text-[11px] font-medium text-muted">+{list.length - 3} mais</p> : null}
                </div>
              </div>
            );
          })}
        </div>

        <Legend colorBy={colorBy} posts={posts} />
      </Card>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Card className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </p>
            <h3 className="font-display text-lg font-bold text-fg">
              {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </h3>
          </div>

          {dayPosts.length ? (
            <ul className="space-y-2">
              {dayPosts.map((p) => (
                <li key={p.id}>
                  <Link to={linkTo(p)} className="block rounded-xl border border-line p-3 transition hover:border-brand/40 hover:bg-fg/[.02]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-fg">{p.title}</p>
                      <span className="mt-0.5 text-muted">
                        <NetworkIcon network={p.network} />
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusChip status={p.status} />
                      <span className="text-xs text-muted">
                        {p.scheduled_at ? new Date(p.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {p.client_name ? (
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.client_color ?? FALLBACK }} />
                          {p.client_name}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-link">
                <Icon name="calendar" />
              </div>
              <p className="text-sm font-semibold text-fg">Nenhum post neste dia</p>
              {onCreate ? <p className="mt-0.5 text-xs text-muted">Que tal planejar algo para essa data?</p> : null}
            </div>
          )}

          {panelExtra ? panelExtra(selected) : null}
          {onCreate && !panelExtra ? (
            <Button className="w-full" onClick={() => onCreate(selected)}>
              <Icon name="plus" className="h-4 w-4" />
              Criar post neste dia
            </Button>
          ) : null}
        </Card>
      </aside>
    </div>
  );
}

function PostChip({ post, colorBy, to, draggable }: { post: CalendarPost; colorBy: 'status' | 'client'; to: string; draggable: boolean }) {
  const byClient = colorBy === 'client';
  const color = post.client_color ?? FALLBACK;
  return (
    <Link
      to={to}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', post.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => e.stopPropagation()}
      title={`${post.client_name ? `${post.client_name}: ` : ''}${post.title} · ${STATUS_LABEL[post.status]}`}
      className={cx(
        'flex items-center gap-1 truncate rounded-md border-l-[3px] px-1.5 py-0.5 text-[11px] font-medium',
        draggable && 'cursor-grab active:cursor-grabbing',
        !byClient && STATUS_CHIP[post.status],
        byClient && 'text-fg',
      )}
      style={byClient ? { background: `${color}1f`, borderLeftColor: color } : undefined}
    >
      <span className="shrink-0 text-muted">
        <NetworkIcon network={post.network} className="h-3 w-3" />
      </span>
      {byClient ? <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_BG[post.status])} aria-hidden /> : null}
      <span className="truncate">{post.title}</span>
    </Link>
  );
}

function Legend({ colorBy, posts }: { colorBy: 'status' | 'client'; posts: CalendarPost[] }) {
  if (colorBy === 'status') {
    return (
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={cx('h-2 w-2 rounded-full', STATUS_BG[s])} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
    );
  }
  const clients = new Map<string, string>();
  for (const p of posts) if (p.client_name) clients.set(p.client_name, p.client_color ?? FALLBACK);
  if (!clients.size) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {[...clients].map(([name, color]) => (
        <span key={name} className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {name}
        </span>
      ))}
    </div>
  );
}
