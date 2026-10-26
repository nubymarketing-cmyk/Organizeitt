import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Network, Post, PostStatus } from '../types/database';
import { usePosts } from '../hooks/usePosts';
import { FORMAT_LABEL, NETWORK_LABEL, STATUS_DOT, STATUS_LABEL, formatDateTime, monthTitle } from '../lib/format';
import { Card, EmptyState, ErrorState, Select, SkeletonList, StatusBadge, cx } from './ui';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Calendário de posts com visão mês e lista e filtros por status e rede.
 * Usado pelo cliente (sem "em criação", o service já filtra) e pela agência.
 */
export function PostCalendar({
  clientId,
  linkTo,
  statuses,
}: {
  clientId: string;
  linkTo: (post: Post) => string;
  statuses: PostStatus[];
}) {
  const [view, setView] = useState<'mes' | 'lista'>('mes');
  const [status, setStatus] = useState<PostStatus | 'all'>('all');
  const [network, setNetwork] = useState<Network | 'all'>('all');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(() => dayKey(new Date()));

  const posts = usePosts({ clientId, status, network });

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts.data ?? []) {
      if (!p.scheduled_at) continue;
      const k = dayKey(new Date(p.scheduled_at));
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return map;
  }, [posts.data]);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthPosts = (posts.data ?? []).filter((p) => {
    if (!p.scheduled_at) return view === 'lista';
    const d = new Date(p.scheduled_at);
    return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
  });
  const dayPosts = byDay.get(selected) ?? [];
  const todayKey = dayKey(new Date());

  const shiftMonth = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_1fr_1fr]">
        <div className="col-span-2 flex w-fit rounded-xl border border-line p-1 sm:col-span-1">
          {(['mes', 'lista'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cx('rounded-lg px-3 py-1.5 text-xs font-bold', view === v ? 'bg-brand text-white' : 'text-muted')}
            >
              {v === 'mes' ? 'Mês' : 'Lista'}
            </button>
          ))}
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as PostStatus | 'all')} className="py-2 text-xs" aria-label="Filtrar por status">
          <option value="all">Todos os status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select value={network} onChange={(e) => setNetwork(e.target.value as Network | 'all')} className="py-2 text-xs" aria-label="Filtrar por rede">
          <option value="all">Todas as redes</option>
          {(Object.keys(NETWORK_LABEL) as Network[]).map((n) => (
            <option key={n} value={n}>
              {NETWORK_LABEL[n]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <button className="rounded-lg px-3 py-1 text-xl text-lilac" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <p className="font-display font-bold text-white">{monthTitle(cursor)}</p>
        <button className="rounded-lg px-3 py-1 text-xl text-lilac" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
          ›
        </button>
      </div>

      {posts.isLoading ? (
        <SkeletonList rows={4} />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : view === 'mes' ? (
        <>
          <Card className="p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-dim">
              {WEEKDAYS.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const k = dayKey(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const list = byDay.get(k) ?? [];
                return (
                  <button
                    key={k}
                    onClick={() => setSelected(k)}
                    className={cx(
                      'flex aspect-square flex-col items-center justify-center rounded-lg text-sm',
                      inMonth ? 'text-white' : 'text-dim/50',
                      selected === k ? 'bg-brand' : k === todayKey ? 'bg-white/10' : 'hover:bg-white/5',
                    )}
                  >
                    {d.getDate()}
                    <span className="mt-0.5 flex h-1.5 gap-0.5">
                      {list.slice(0, 3).map((p) => (
                        <span key={p.id} className={cx('h-1.5 w-1.5 rounded-full', STATUS_DOT[p.status])} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          {dayPosts.length ? (
            <PostList posts={dayPosts} linkTo={linkTo} />
          ) : (
            <p className="text-center text-sm text-dim">Nenhum post neste dia.</p>
          )}
        </>
      ) : monthPosts.length ? (
        <PostList posts={monthPosts} linkTo={linkTo} />
      ) : (
        <EmptyState title="Nenhum post neste mês" text="Mude o mês ou os filtros para ver outros posts." />
      )}
    </div>
  );
}

export function PostList({ posts, linkTo }: { posts: Post[]; linkTo: (post: Post) => string }) {
  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <Link key={p.id} to={linkTo(p)} className="block">
          <Card className="flex items-center justify-between gap-3 py-3 hover:border-violet/40">
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{p.title}</p>
              <p className="text-xs text-muted">
                {formatDateTime(p.scheduled_at)} · {NETWORK_LABEL[p.network]} · {FORMAT_LABEL[p.format]}
              </p>
            </div>
            <StatusBadge status={p.status} />
          </Card>
        </Link>
      ))}
    </div>
  );
}
