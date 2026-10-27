import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useAgency';
import { useClients } from '../../hooks/useClients';
import { useActivity, useOverview } from '../../hooks/useOverview';
import { useAgencyPosts } from '../../hooks/usePosts';
import { NETWORK_LABEL, STATUS_LABEL, formatDateTime, formatDay, monthLabel, timeAgo } from '../../lib/format';
import type { AttentionItem } from '../../services/overview';
import type { Network, PostStatus } from '../../types/database';
import { Card, Dropdown, EmptyState, ErrorState, PageHeader, Skeleton, SkeletonList, cx } from '../../components/ui';
import { AgencyPostRow, activityText } from '../../components/AgencyParts';

export function VisaoGeralPage() {
  const { data: profile } = useSession();
  const overview = useOverview();
  const firstName = profile?.full_name.split(' ')[0] ?? '';

  return (
    <div className="space-y-8">
      <PageHeader title={`Olá, ${firstName}`} subtitle="O que está acontecendo com os seus clientes." />

      {overview.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : overview.isError || !overview.data ? (
        <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NumberCard to="/agencia/agenda?filtro=aguardando" value={overview.data.awaiting} label="aguardando aprovação" tone="warn" />
          <NumberCard to="/agencia/agenda?filtro=ajustes" value={overview.data.changes} label="ajustes pedidos" tone="bad" />
          <NumberCard to="/agencia/agenda?filtro=atrasados" value={overview.data.overdue} label="posts atrasados" tone="bad" />
          <NumberCard
            to="/agencia/relatorios-pendentes"
            value={overview.data.reports_missing}
            label={`relatórios de ${monthLabel(overview.data.report_month).split(' ')[0].toLowerCase()} não lançados`}
            tone="warn"
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <WeekBlock />
        <div className="space-y-8">
          <AttentionBlock items={overview.data?.attention} loading={overview.isLoading} />
          <ActivityBlock />
        </div>
      </div>
    </div>
  );
}

function NumberCard({ to, value, label, tone }: { to: string; value: number; label: string; tone: 'warn' | 'bad' }) {
  const color = value === 0 ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-bad';
  return (
    <Link to={to} className="block">
      <Card className="h-full hover:border-violet/40">
        <p className={cx('font-display text-4xl font-extrabold', color)}>{value}</p>
        <p className="mt-1 text-sm text-muted">{label}</p>
      </Card>
    </Link>
  );
}

function WeekBlock() {
  // Janela fixa enquanto a página está aberta, para a lista não recarregar a cada render.
  const [range] = useState(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from: from.toISOString(), to: to.toISOString() };
  });
  const posts = useAgencyPosts(range);
  const clients = useClients();
  const team = useTeam();
  const [clientId, setClientId] = useState('all');
  const [network, setNetwork] = useState<Network | 'all'>('all');
  const [status, setStatus] = useState<PostStatus | 'all'>('all');
  const [assignee, setAssignee] = useState('all');

  const names = useMemo(() => new Map((team.data ?? []).map((m) => [m.id, m.full_name])), [team.data]);
  const list = (posts.data ?? [])
    .filter((p) => clientId === 'all' || p.client_id === clientId)
    .filter((p) => network === 'all' || p.network === network)
    .filter((p) => status === 'all' || p.status === status)
    .filter((p) => assignee === 'all' || (assignee === 'none' ? !p.assignee_id : p.assignee_id === assignee));
  const filtered = clientId !== 'all' || network !== 'all' || status !== 'all' || assignee !== 'all';

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold text-fg">Esta semana</h2>
        <Link to="/agencia/agenda" className="text-sm font-medium text-link hover:underline">
          abrir agenda
        </Link>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Dropdown
          label="Cliente"
          allLabel="Todos os clientes"
          value={clientId}
          onChange={setClientId}
          options={(clients.data ?? []).map((c) => ({ value: c.id, label: c.name, dot: c.color ?? undefined }))}
        />
        <Dropdown
          label="Rede"
          allLabel="Todas as redes"
          value={network}
          onChange={(v) => setNetwork(v as Network | 'all')}
          options={(Object.keys(NETWORK_LABEL) as Network[]).map((n) => ({ value: n, label: NETWORK_LABEL[n] }))}
        />
        <Dropdown
          label="Status"
          allLabel="Todos os status"
          value={status}
          onChange={(v) => setStatus(v as PostStatus | 'all')}
          options={(Object.keys(STATUS_LABEL) as PostStatus[]).map((st) => ({ value: st, label: STATUS_LABEL[st] }))}
        />
        <Dropdown
          label="Responsável"
          allLabel="Todos os responsáveis"
          value={assignee}
          onChange={setAssignee}
          options={[
            { value: 'none', label: 'Sem responsável' },
            ...(team.data ?? []).filter((m) => !m.pending).map((m) => ({ value: m.id, label: m.full_name })),
          ]}
        />
      </div>

      {posts.isLoading ? (
        <SkeletonList rows={4} />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : list.length ? (
        <div className="space-y-2">
          {list.map((p) => (
            <AgencyPostRow key={p.id} post={p} assigneeName={p.assignee_id ? names.get(p.assignee_id) : undefined} />
          ))}
        </div>
      ) : filtered ? (
        <EmptyState title="Nenhum post com estes filtros" text="Mude os filtros para ver os outros posts da semana." />
      ) : (
        <EmptyState
          illustration="calendar"
          title="Nada agendado para os próximos 7 dias"
          text={clients.data?.length ? 'Abra um cliente e crie o próximo post.' : 'Cadastre o primeiro cliente para começar a planejar.'}
        />
      )}
    </section>
  );
}

function attentionLink(a: AttentionItem): string {
  if (a.post_id) return `/agencia/posts/${a.post_id}`;
  if (a.kind === 'charge_overdue') return `/agencia/clientes/${a.client_id}?aba=financeiro`;
  return `/agencia/clientes/${a.client_id}`;
}

function attentionText(a: AttentionItem): { title: string; detail: string } {
  switch (a.kind) {
    case 'no_posts_week':
      return { title: a.client_name, detail: 'Sem post agendado nos próximos 7 dias' };
    case 'awaiting_48h':
      return { title: a.post_title ?? 'Post', detail: `${a.client_name} · aguardando aprovação ${timeAgo(a.since)}` };
    case 'changes_24h':
      return { title: a.post_title ?? 'Post', detail: `${a.client_name} · ajuste pedido ${timeAgo(a.since)} sem resposta` };
    case 'charge_overdue':
      return { title: a.client_name, detail: `Mensalidade vencida desde ${a.since ? formatDay(a.since) : ''}` };
  }
}

function AttentionBlock({ items, loading }: { items: AttentionItem[] | undefined; loading: boolean }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold text-fg">Precisa de atenção</h2>
      {loading ? (
        <SkeletonList rows={2} />
      ) : !items?.length ? (
        <Card className="text-sm text-muted">Nada fora do lugar. Quando algo atrasar, aparece aqui.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((a, i) => {
            const t = attentionText(a);
            return (
              <Link key={`${a.kind}-${a.post_id ?? a.client_id}-${i}`} to={attentionLink(a)} className="block">
                <Card className={cx('py-3 hover:border-violet/40', a.kind === 'charge_overdue' || a.kind === 'changes_24h' ? 'border-bad/30' : 'border-warn/30')}>
                  <p className="truncate text-sm font-semibold text-fg">{t.title}</p>
                  <p className="text-xs text-muted">{t.detail}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActivityBlock() {
  const activity = useActivity(20);
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold text-fg">Atividade recente</h2>
      {activity.isLoading ? (
        <SkeletonList rows={3} />
      ) : activity.isError ? (
        <ErrorState error={activity.error} onRetry={() => activity.refetch()} />
      ) : !activity.data?.length ? (
        <Card className="text-sm text-muted">Ainda não há movimento. Envie um post para aprovação e acompanhe aqui.</Card>
      ) : (
        <Card className="divide-y divide-line p-0">
          {activity.data.map((a) => {
            const row = (
              <div className="px-4 py-3">
                <p className="text-sm text-fg">{activityText(a)}</p>
                <p className="text-xs text-dim">{formatDateTime(a.created_at)}</p>
              </div>
            );
            return a.post_id ? (
              <Link key={a.id} to={`/agencia/posts/${a.post_id}`} className="block hover:bg-fg/[.03]">
                {row}
              </Link>
            ) : (
              <div key={a.id}>{row}</div>
            );
          })}
        </Card>
      )}
    </section>
  );
}
