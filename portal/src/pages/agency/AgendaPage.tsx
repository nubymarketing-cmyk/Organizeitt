import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTeam } from '../../hooks/useAgency';
import { useClients } from '../../hooks/useClients';
import { useAgencyPosts, useReschedulePost } from '../../hooks/usePosts';
import { NETWORK_LABEL, STATUS_LABEL } from '../../lib/format';
import type { AgencyPostFilters } from '../../services/posts';
import type { Network, PostStatus } from '../../types/database';
import { Dropdown, EmptyState, ErrorState, InlineError, PageHeader, Segmented, SkeletonList, cx } from '../../components/ui';
import { AgencyPostRow } from '../../components/AgencyParts';
import { PostMonthCalendar, monthRange } from '../../components/PostMonthCalendar';

/** Atalhos dos cards da visão geral. */
const QUICK = {
  aguardando: { label: 'Aguardando aprovação', filters: { status: 'awaiting_approval' } },
  ajustes: { label: 'Ajustes pedidos', filters: { status: 'changes_requested' } },
  atrasados: { label: 'Atrasados', filters: { overdue: true } },
} satisfies Record<string, { label: string; filters: AgencyPostFilters }>;
type Quick = keyof typeof QUICK;

/**
 * Agenda: a visão de todos os clientes, em calendário ou lista.
 * O que é de um cliente só fica dentro da página dele, em Clientes.
 */
export function AgendaPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = params.get('visao') === 'lista' || params.get('filtro') ? 'lista' : 'calendario';
  const quick = (params.get('filtro') ?? '') as Quick | '';
  const clientId = params.get('cliente') ?? 'all';
  const network = (params.get('rede') ?? 'all') as Network | 'all';
  const status = (params.get('status') ?? 'all') as PostStatus | 'all';
  const assignee = params.get('responsavel') ?? 'all';

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const filters = useMemo<AgencyPostFilters>(
    () => ({
      ...(view === 'calendario' ? monthRange(cursor) : {}),
      ...(quick && QUICK[quick] ? QUICK[quick].filters : {}),
      ...(clientId !== 'all' ? { clientId } : {}),
      ...(network !== 'all' ? { network } : {}),
      ...(status !== 'all' && !quick ? { status } : {}),
      ...(assignee !== 'all' ? { assigneeId: assignee } : {}),
    }),
    [view, cursor, quick, clientId, network, status, assignee],
  );
  const posts = useAgencyPosts(filters);
  const clients = useClients();
  const team = useTeam();
  const move = useReschedulePost();
  const names = useMemo(() => new Map((team.data ?? []).map((m) => [m.id, m.full_name])), [team.data]);
  const [createFor, setCreateFor] = useState('all');

  const set = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (!v || v === 'all') next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  const hasFilters = !!(quick || clientId !== 'all' || network !== 'all' || status !== 'all' || assignee !== 'all');
  const clientOptions = (clients.data ?? []).map((c) => ({ value: c.id, label: c.name, dot: c.color ?? undefined }));
  const targetClient = clientId !== 'all' ? clientId : createFor !== 'all' ? createFor : clients.data?.length === 1 ? clients.data[0].id : null;
  const createOn = (day: string) => targetClient && navigate(`/agencia/clientes/${targetClient}/posts/novo?data=${day}`);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agenda"
        subtitle="Todos os clientes num lugar só. Para ver um cliente por inteiro, abra-o em Clientes."
        action={
          <Segmented
            value={view}
            onChange={(v) => set({ visao: v === 'lista' ? 'lista' : '', filtro: v === 'calendario' ? '' : quick })}
            options={[
              ['calendario', 'Calendário', 'grid'],
              ['lista', 'Lista', 'list'],
            ]}
          />
        }
      />

      <div className="space-y-3">
        {view === 'lista' ? (
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {(Object.keys(QUICK) as Quick[]).map((k) => (
              <button
                key={k}
                onClick={() => set({ filtro: quick === k ? '' : k, status: '' })}
                aria-pressed={quick === k}
                className={cx(
                  'min-h-[36px] whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition',
                  quick === k ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:text-fg',
                )}
              >
                {QUICK[k].label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Dropdown label="Todos os clientes" allLabel="Todos os clientes" value={clientId} onChange={(v) => set({ cliente: v })} options={clientOptions} />
          <Dropdown
            label="Todas as redes"
            allLabel="Todas as redes"
            value={network}
            onChange={(v) => set({ rede: v })}
            options={(Object.keys(NETWORK_LABEL) as Network[]).map((n) => ({ value: n, label: NETWORK_LABEL[n] }))}
          />
          <Dropdown
            label="Todos os status"
            allLabel="Todos os status"
            value={quick ? 'all' : status}
            onChange={(v) => set({ status: v, filtro: '' })}
            options={(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <Dropdown
            label="Todos os responsáveis"
            allLabel="Todos os responsáveis"
            value={assignee}
            onChange={(v) => set({ responsavel: v })}
            options={[
              { value: 'none', label: 'Sem responsável' },
              ...(team.data ?? []).filter((m) => !m.pending).map((m) => ({ value: m.id, label: m.full_name })),
            ]}
          />
        </div>
        {hasFilters ? (
          <button
            className="text-sm font-medium text-link hover:underline"
            onClick={() => set({ filtro: '', cliente: '', rede: '', status: '', responsavel: '' })}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <InlineError error={move.error} />

      {posts.isLoading || clients.isLoading ? (
        <SkeletonList rows={5} />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : !clients.data?.length ? (
        <EmptyState icon="users" title="Nenhum cliente ainda" text="Cadastre o primeiro cliente e os posts dele aparecem aqui." />
      ) : view === 'calendario' ? (
        <PostMonthCalendar
          cursor={cursor}
          onCursor={setCursor}
          posts={posts.data ?? []}
          colorBy="client"
          linkTo={(p) => `/agencia/posts/${p.id}`}
          onCreate={targetClient ? createOn : undefined}
          onMove={(p, day) => {
            const old = p.scheduled_at ? new Date(p.scheduled_at) : null;
            const next = new Date(day);
            next.setHours(old?.getHours() ?? 10, old?.getMinutes() ?? 0, 0, 0);
            if (!old || old.getTime() !== next.getTime()) move.mutate({ id: p.id, scheduledAt: next.toISOString() });
          }}
          panelExtra={
            targetClient
              ? undefined
              : () => (
                  <div className="space-y-2 border-t border-line pt-3">
                    <p className="text-sm font-medium text-fg">Criar post para qual cliente?</p>
                    <Dropdown label="Escolha o cliente" value={createFor} onChange={setCreateFor} options={clientOptions} />
                  </div>
                )
          }
        />
      ) : posts.data?.length ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            {posts.data.length} post{posts.data.length === 1 ? '' : 's'}
          </p>
          {posts.data.map((p) => (
            <AgencyPostRow key={p.id} post={p} assigneeName={p.assignee_id ? names.get(p.assignee_id) : undefined} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="calendar"
          title={hasFilters ? 'Nenhum post com estes filtros' : 'Nenhum post ainda'}
          text={quick ? 'Bom sinal: nada pendente aqui.' : hasFilters ? 'Mude os filtros para ver outros posts.' : 'Abra um cliente e crie o primeiro post.'}
        />
      )}
    </div>
  );
}
