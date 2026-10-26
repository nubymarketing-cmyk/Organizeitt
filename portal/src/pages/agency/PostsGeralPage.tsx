import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTeam } from '../../hooks/useAgency';
import { useClients } from '../../hooks/useClients';
import { useAgencyPosts } from '../../hooks/usePosts';
import { NETWORK_LABEL, STATUS_LABEL } from '../../lib/format';
import type { AgencyPostFilters } from '../../services/posts';
import type { Network, PostStatus } from '../../types/database';
import { EmptyState, ErrorState, PageHeader, Select, SkeletonList, cx } from '../../components/ui';
import { AgencyPostRow } from '../../components/AgencyParts';

/** Atalhos dos cards da visão geral. */
const QUICK = {
  aguardando: { label: 'Aguardando aprovação', filters: { status: 'awaiting_approval' } },
  ajustes: { label: 'Ajustes pedidos', filters: { status: 'changes_requested' } },
  atrasados: { label: 'Atrasados', filters: { overdue: true } },
} satisfies Record<string, { label: string; filters: AgencyPostFilters }>;
type Quick = keyof typeof QUICK;

/** Posts de todos os clientes, com filtros na URL (os cards da visão geral abrem aqui). */
export function PostsGeralPage() {
  const [params, setParams] = useSearchParams();
  const quick = (params.get('filtro') ?? '') as Quick | '';
  const clientId = params.get('cliente') ?? '';
  const network = (params.get('rede') ?? 'all') as Network | 'all';
  const status = (params.get('status') ?? 'all') as PostStatus | 'all';
  const assignee = params.get('responsavel') ?? '';

  const filters = useMemo<AgencyPostFilters>(
    () => ({
      ...(quick && QUICK[quick] ? QUICK[quick].filters : {}),
      ...(clientId ? { clientId } : {}),
      ...(network !== 'all' ? { network } : {}),
      ...(status !== 'all' && !quick ? { status } : {}),
      ...(assignee ? { assigneeId: assignee } : {}),
    }),
    [quick, clientId, network, status, assignee],
  );
  const posts = useAgencyPosts(filters);
  const clients = useClients();
  const team = useTeam();
  const names = useMemo(() => new Map((team.data ?? []).map((m) => [m.id, m.full_name])), [team.data]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key === 'status') next.delete('filtro');
    setParams(next, { replace: true });
  };
  const hasFilters = !!(quick || clientId || network !== 'all' || status !== 'all' || assignee);

  return (
    <div>
      <PageHeader title="Posts" subtitle="Todos os clientes num lugar só." />

      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(QUICK) as Quick[]).map((k) => (
          <button
            key={k}
            onClick={() => set('filtro', quick === k ? '' : k)}
            className={cx(
              'min-h-[36px] rounded-full border px-3.5 text-xs font-bold',
              quick === k ? 'border-transparent bg-brand text-white' : 'border-line text-muted',
            )}
          >
            {QUICK[k].label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select value={clientId || 'all'} onChange={(e) => set('cliente', e.target.value)} className="py-2 text-xs" aria-label="Filtrar por cliente">
          <option value="all">Todos os clientes</option>
          {(clients.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={network} onChange={(e) => set('rede', e.target.value)} className="py-2 text-xs" aria-label="Filtrar por rede">
          <option value="all">Todas as redes</option>
          {(Object.keys(NETWORK_LABEL) as Network[]).map((n) => (
            <option key={n} value={n}>{NETWORK_LABEL[n]}</option>
          ))}
        </Select>
        <Select value={quick ? 'all' : status} onChange={(e) => set('status', e.target.value)} className="py-2 text-xs" aria-label="Filtrar por status">
          <option value="all">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
        <Select value={assignee || 'all'} onChange={(e) => set('responsavel', e.target.value)} className="py-2 text-xs" aria-label="Filtrar por responsável">
          <option value="all">Todos os responsáveis</option>
          <option value="none">Sem responsável</option>
          {(team.data ?? []).filter((m) => !m.pending).map((m) => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </Select>
      </div>

      {posts.isLoading ? (
        <SkeletonList rows={5} />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : posts.data?.length ? (
        <div className="space-y-2">
          <p className="text-xs text-dim">{posts.data.length} post{posts.data.length === 1 ? '' : 's'}</p>
          {posts.data.map((p) => (
            <AgencyPostRow key={p.id} post={p} assigneeName={p.assignee_id ? names.get(p.assignee_id) : undefined} />
          ))}
        </div>
      ) : hasFilters ? (
        <EmptyState title="Nenhum post com estes filtros" text={quick ? 'Bom sinal: nada pendente aqui.' : 'Mude os filtros para ver outros posts.'} />
      ) : (
        <EmptyState title="Nenhum post ainda" text="Abra um cliente e crie o primeiro post." />
      )}
    </div>
  );
}
