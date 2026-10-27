import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useAgency';
import { useClient, useClientUsers, useClients, useDeactivateClient, useUpdateClient } from '../../hooks/useClients';
import { usePosts, useReschedulePost } from '../../hooks/usePosts';
import { NETWORK_LABEL, ROLE_LABEL, STATUS_LABEL, capitalize, formatDateTime } from '../../lib/format';
import type { Client, Network, Post, PostStatus } from '../../types/database';
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  Dropdown,
  EmptyState,
  ErrorState,
  Field,
  InlineError,
  Input,
  Modal,
  Segmented,
  Skeleton,
  SkeletonList,
  StatusChip,
  Tabs,
  cx,
} from '../../components/ui';
import { Icon, NetworkIcon } from '../../components/icons';
import { ClientAvatar } from '../../components/AgencyParts';
import { PostMonthCalendar } from '../../components/PostMonthCalendar';
import { FolderBrowser } from '../../components/FolderBrowser';
import { InviteUserModal } from '../../components/InviteUserModal';
import { AgencyReports } from './AgencyReports';
import { ClienteFinanceiro } from './ClienteFinanceiro';

type Tab = 'posts' | 'relatorios' | 'arquivos' | 'usuarios' | 'financeiro';
const TABS: Array<[Tab, string]> = [
  ['posts', 'Posts'],
  ['relatorios', 'Relatórios'],
  ['arquivos', 'Arquivos'],
  ['usuarios', 'Usuários'],
  ['financeiro', 'Financeiro'],
];

const PAYMENT: Record<string, { label: string; tone: 'neutral' | 'ok' | 'warn' | 'bad' }> = {
  none: { label: 'Sem cobrança lançada', tone: 'neutral' },
  open: { label: 'Mensalidade a vencer', tone: 'warn' },
  paid: { label: 'Pagamentos em dia', tone: 'ok' },
  overdue: { label: 'Mensalidade vencida', tone: 'bad' },
};

export function ClienteDetalhePage() {
  const { clientId } = useParams();
  const client = useClient(clientId);
  const clients = useClients();
  const posts = usePosts({ clientId });
  const { data: profile } = useSession();
  const team = useTeam();
  const isAdmin = profile?.role === 'agency_admin';
  // Aba na URL (?aba=financeiro), para os atalhos da visão geral abrirem direto nela.
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter(([k]) => k !== 'financeiro' || isAdmin);
  const tab = (tabs.find(([k]) => k === params.get('aba'))?.[0] ?? 'posts') as Tab;
  const setTab = (k: Tab) => setParams(k === 'posts' ? {} : { aba: k }, { replace: true });
  const [editing, setEditing] = useState(false);

  if (client.isLoading) return <Skeleton className="h-40" />;
  if (client.isError || !client.data || !clientId) {
    return (
      <div className="space-y-4">
        <Link to="/agencia/clientes" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-link">
          <Icon name="chevronLeft" className="h-4 w-4" /> Clientes
        </Link>
        <ErrorState error={client.error} onRetry={() => client.refetch()} />
      </div>
    );
  }

  const c = client.data;
  const stats = clients.data?.find((x) => x.id === c.id);
  const servedBy = (team.data ?? []).filter((m) => m.role === 'agency_member' && !m.pending && m.client_ids.includes(clientId));
  const now = Date.now();
  const nextWeek = (posts.data ?? []).filter((p) => {
    if (!p.scheduled_at || p.status === 'published') return false;
    const t = new Date(p.scheduled_at).getTime();
    return t >= now && t < now + 7 * 86_400_000;
  }).length;
  const payment = PAYMENT[stats?.payment_status ?? 'none'];

  return (
    <div className="space-y-6">
      <Link to="/agencia/clientes" className="inline-flex min-h-[44px] items-center gap-1 text-sm text-link">
        <Icon name="chevronLeft" className="h-4 w-4" /> Clientes
      </Link>

      <div className="-mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <ClientAvatar name={c.name} color={c.color} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-fg">{c.name}</h1>
              {c.specialty ? <Badge tone="brand">{capitalize(c.specialty)}</Badge> : null}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {c.contact_email ?? 'Sem e-mail de contato'}
              {' · '}
              {servedBy.length ? `Atendido por ${servedBy.map((m) => m.full_name).join(', ')}` : 'Ainda sem responsável na equipe'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar cliente
            </Button>
          ) : null}
          <Link to={`/agencia/clientes/${clientId}/posts/novo`}>
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Novo post
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumo rápido do cliente */}
      <div className={cx('grid grid-cols-2 gap-3', isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        <Stat
          label="Posts no mês"
          value={stats ? `${stats.month_published} de ${stats.month_planned}` : '—'}
          hint="publicados de planejados"
        />
        <Stat
          label="Aguardando aprovação"
          value={stats ? String(stats.awaiting_count) : '—'}
          hint={stats?.changes_count ? `e ${stats.changes_count} com ajuste pedido` : 'nenhum ajuste pendente'}
          tone={stats?.awaiting_count ? 'warn' : undefined}
        />
        <Stat label="Próximos 7 dias" value={posts.data ? String(nextWeek) : '—'} hint="posts agendados" />
        {isAdmin ? (
          <Card className="flex flex-col justify-between gap-2">
            <p className="text-sm text-muted">Contrato</p>
            <div>
              <Badge tone={payment.tone}>{payment.label}</Badge>
            </div>
            <button className="self-start text-xs font-medium text-link hover:underline" onClick={() => setTab('financeiro')}>
              ver financeiro
            </button>
          </Card>
        ) : null}
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      <div>
        {tab === 'posts' ? <ClientPostsTab clientId={clientId} posts={posts.data} loading={posts.isLoading} error={posts.isError ? posts.error : null} onRetry={() => posts.refetch()} /> : null}
        <div className="max-w-3xl">
          {tab === 'relatorios' ? <AgencyReports clientId={clientId} /> : null}
          {tab === 'arquivos' ? <FolderBrowser clientId={clientId} /> : null}
          {tab === 'usuarios' ? <ClientUsers clientId={clientId} /> : null}
          {tab === 'financeiro' ? <ClienteFinanceiro key={c.id} client={c} /> : null}
        </div>
      </div>

      {editing ? <EditClientModal client={c} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'warn' }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className={cx('mt-1 font-display text-2xl font-bold', tone === 'warn' ? 'text-warn' : 'text-fg')}>{value}</p>
      {hint ? <p className="text-xs text-dim">{hint}</p> : null}
    </Card>
  );
}

const STATUS_FILTERS: Array<PostStatus | 'all'> = ['all', 'in_creation', 'awaiting_approval', 'changes_requested', 'approved', 'published'];

/** Posts do cliente: calendário com painel do dia (ou lista), filtros em chips e dropdown. */
function ClientPostsTab({
  clientId,
  posts,
  loading,
  error,
  onRetry,
}: {
  clientId: string;
  posts: Post[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const move = useReschedulePost();
  const [view, setView] = useState<'calendario' | 'lista'>('calendario');
  const [status, setStatus] = useState<PostStatus | 'all'>('all');
  const [network, setNetwork] = useState<Network | 'all'>('all');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const list = useMemo(
    () => (posts ?? []).filter((p) => (status === 'all' || p.status === status) && (network === 'all' || p.network === network)),
    [posts, status, network],
  );
  const create = (day?: string) => navigate(`/agencia/clientes/${clientId}/posts/novo${day ? `?data=${day}` : ''}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cx(
                'min-h-[36px] whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition',
                status === s ? 'border-brand bg-brand text-brand-fg' : 'border-line bg-surface text-muted hover:text-fg',
              )}
            >
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Dropdown
              label="Rede"
              allLabel="Todas as redes"
              value={network}
              onChange={(v) => setNetwork(v as Network | 'all')}
              options={(Object.keys(NETWORK_LABEL) as Network[]).map((n) => ({ value: n, label: NETWORK_LABEL[n] }))}
            />
          </div>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              ['calendario', 'Calendário', 'grid'],
              ['lista', 'Lista', 'list'],
            ]}
          />
        </div>
      </div>

      <InlineError error={move.error} />

      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : view === 'calendario' ? (
        <PostMonthCalendar
          cursor={cursor}
          onCursor={setCursor}
          posts={list}
          colorBy="status"
          linkTo={(p) => `/agencia/posts/${p.id}`}
          onCreate={create}
          onMove={(p, day) => {
            const old = p.scheduled_at ? new Date(p.scheduled_at) : null;
            const next = new Date(day);
            next.setHours(old?.getHours() ?? 10, old?.getMinutes() ?? 0, 0, 0);
            if (!old || old.getTime() !== next.getTime()) move.mutate({ id: p.id, scheduledAt: next.toISOString() });
          }}
        />
      ) : list.length ? (
        <div className="space-y-2">
          {list.map((p) => (
            <Link key={p.id} to={`/agencia/posts/${p.id}`} className="block">
              <Card className="flex items-center gap-3 py-3 transition hover:border-brand/40">
                <span className="text-muted">
                  <NetworkIcon network={p.network} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{p.title}</p>
                  <p className="text-xs text-muted">{formatDateTime(p.scheduled_at)}</p>
                </div>
                <StatusChip status={p.status} />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration="calendar"
          title={posts?.length ? 'Nenhum post com estes filtros' : 'Nenhum post ainda'}
          text={posts?.length ? 'Mude os filtros para ver os outros posts.' : 'Planeje o primeiro post deste cliente.'}
          action={posts?.length ? undefined : <Button onClick={() => create()}>Criar post</Button>}
        />
      )}
    </div>
  );
}

function ClientUsers({ clientId }: { clientId: string }) {
  const { data: profile } = useSession();
  const users = useClientUsers(clientId);
  const deactivate = useDeactivateClient();
  const navigate = useNavigate();
  const [inviting, setInviting] = useState(false);
  const isAdmin = profile?.role === 'agency_admin';

  return (
    <div className="space-y-4">
      {isAdmin ? <Button onClick={() => setInviting(true)}>Convidar usuário da clínica</Button> : null}
      {users.isLoading ? (
        <SkeletonList rows={2} />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : users.data?.length ? (
        <div className="space-y-2">
          {users.data.map((u) => (
            <Card key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-fg">{u.full_name}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <span className="text-xs text-lilac">{ROLE_LABEL[u.role]}</span>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState illustration="people" title="Ninguém da clínica tem acesso ainda" text="Convide o dono ou a recepção para começar a aprovar posts." />
      )}

      {isAdmin ? (
        <div className="border-t border-line pt-4">
          <ConfirmButton
            variant="danger"
            loading={deactivate.isPending}
            label="Desativar cliente"
            question="Desativar este cliente? Os dados ficam guardados, mas ele some da lista."
            confirmLabel="Desativar"
            onConfirm={() => deactivate.mutate(clientId, { onSuccess: () => navigate('/agencia/clientes') })}
          />
          <InlineError error={deactivate.error} />
        </div>
      ) : null}

      <InviteUserModal open={inviting} onClose={() => setInviting(false)} clientId={clientId} />
    </div>
  );
}

function EditClientModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const update = useUpdateClient();
  const [form, setForm] = useState({
    name: client.name,
    specialty: client.specialty ?? '',
    contact_email: client.contact_email ?? '',
    color: client.color ?? '#0E7C6B',
    fee: client.monthly_fee?.toString() ?? '',
    day: client.billing_day?.toString() ?? '',
  });
  const fee = form.fee.trim() ? Number(form.fee.replace(',', '.')) : null;
  const day = form.day.trim() ? Number(form.day) : null;

  return (
    <Modal open onClose={onClose} title="Editar cliente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(
            {
              id: client.id,
              input: {
                name: form.name,
                specialty: form.specialty,
                contact_email: form.contact_email,
                color: form.color,
                monthly_fee: fee,
                billing_day: day,
              },
            },
            { onSuccess: onClose },
          );
        }}
      >
        <Field label="Nome da clínica">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Especialidade">
          <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </Field>
        <Field label="E-mail de contato">
          <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </Field>
        <Field label="Cor no calendário">
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mensalidade (R$)">
            <Input inputMode="decimal" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="0,00" />
          </Field>
          <Field label="Dia de vencimento" hint="De 1 a 28">
            <Input inputMode="numeric" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
          </Field>
        </div>
        <InlineError error={update.error} />
        <Button type="submit" className="w-full" loading={update.isPending} disabled={(fee !== null && Number.isNaN(fee)) || (day !== null && Number.isNaN(day))}>
          Salvar
        </Button>
      </form>
    </Modal>
  );
}
