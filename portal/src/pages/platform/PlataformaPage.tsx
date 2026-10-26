import { useState } from 'react';
import { useIsPlatformAdmin, usePlatformAgencies, usePlatformUpdateAgency } from '../../hooks/useAgency';
import { AGENCY_STATUS_LABEL, PLAN_LABEL, formatDate } from '../../lib/format';
import type { PlatformAgency } from '../../services/agency';
import type { AgencyPlan, AgencyStatus } from '../../types/database';
import { Card, EmptyState, ErrorState, Field, InlineError, Input, PageHeader, Select, Skeleton, SkeletonList } from '../../components/ui';

/** Painel do dono da plataforma: todas as agências, plano, status e uso. */
export function PlataformaPage() {
  const access = useIsPlatformAdmin();
  if (access.isLoading) return <Skeleton className="h-40" />;
  if (!access.data) return <EmptyState title="Área restrita" text="Só o dono da plataforma acessa esta página." />;
  return <AgencyList />;
}

function AgencyList() {
  const agencies = usePlatformAgencies();
  const [search, setSearch] = useState('');
  const list = (agencies.data ?? []).filter((a) =>
    `${a.name} ${a.admin_email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const totals = (agencies.data ?? []).reduce(
    (t, a) => ({ clients: t.clients + Number(a.clients_count), posts: t.posts + Number(a.posts_month) }),
    { clients: 0, posts: 0 },
  );

  return (
    <div>
      <PageHeader
        title="Plataforma"
        subtitle={
          agencies.data
            ? `${agencies.data.length} agência${agencies.data.length === 1 ? '' : 's'} · ${totals.clients} clientes ativos · ${totals.posts} posts criados este mês`
            : undefined
        }
      />
      <Input placeholder="Buscar agência ou e-mail…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />

      {agencies.isLoading ? (
        <SkeletonList rows={3} />
      ) : agencies.isError ? (
        <ErrorState error={agencies.error} onRetry={() => agencies.refetch()} />
      ) : !list.length ? (
        <EmptyState
          title={search ? 'Nenhuma agência encontrada' : 'Nenhuma agência ainda'}
          text={search ? 'Confira o que foi digitado.' : 'As agências aparecem aqui assim que se cadastrarem.'}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((a) => (
            <AgencyCard key={a.id} agency={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgencyCard({ agency }: { agency: PlatformAgency }) {
  const update = usePlatformUpdateAgency();
  const change = (plan: AgencyPlan, status: AgencyStatus) => update.mutate({ id: agency.id, plan, status });
  const overLimit = agency.client_limit !== null && Number(agency.clients_count) > agency.client_limit;

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold text-white">{agency.name}</p>
        <p className="text-xs text-muted">
          {agency.admin_email ?? 'sem admin'} · desde {formatDate(agency.created_at)}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="clientes" value={agency.client_limit === null ? `${agency.clients_count}` : `${agency.clients_count}/${agency.client_limit}`} warn={overLimit} />
        <Stat label="usuários" value={`${agency.users_count}`} />
        <Stat label="posts no mês" value={`${agency.posts_month}`} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Plano">
          <Select value={agency.plan} disabled={update.isPending} onChange={(e) => change(e.target.value as AgencyPlan, agency.status)}>
            {(Object.keys(PLAN_LABEL) as AgencyPlan[]).map((p) => (
              <option key={p} value={p}>{PLAN_LABEL[p]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={agency.status} disabled={update.isPending} onChange={(e) => change(agency.plan, e.target.value as AgencyStatus)}>
            {(Object.keys(AGENCY_STATUS_LABEL) as AgencyStatus[]).map((s) => (
              <option key={s} value={s}>{AGENCY_STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </Field>
      </div>
      {agency.status === 'trial' && agency.trial_ends_at ? (
        <p className="text-xs text-dim">Teste até {formatDate(agency.trial_ends_at)}.</p>
      ) : null}
      <InlineError error={update.error} />
    </Card>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[.04] px-2 py-2">
      <p className={warn ? 'font-display text-lg font-bold text-warn' : 'font-display text-lg font-bold text-white'}>{value}</p>
      <p className="text-[11px] text-dim">{label}</p>
    </div>
  );
}
