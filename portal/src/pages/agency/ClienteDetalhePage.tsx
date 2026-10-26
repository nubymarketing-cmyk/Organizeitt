import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useAgency';
import { useClient, useClientUsers, useDeactivateClient, useUpdateClient } from '../../hooks/useClients';
import { ROLE_LABEL } from '../../lib/format';
import type { Client, PostStatus } from '../../types/database';
import { Button, Card, ConfirmButton, EmptyState, ErrorState, Field, InlineError, Input, Modal, Skeleton, SkeletonList, cx } from '../../components/ui';
import { ClientAvatar } from '../../components/AgencyParts';
import { PostCalendar } from '../../components/PostCalendar';
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
const ALL_STATUSES: PostStatus[] = ['in_creation', 'awaiting_approval', 'changes_requested', 'approved', 'published'];

export function ClienteDetalhePage() {
  const { clientId } = useParams();
  const client = useClient(clientId);
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
        <Link to="/agencia/clientes" className="text-sm text-lilac">‹ Clientes</Link>
        <ErrorState error={client.error} onRetry={() => client.refetch()} />
      </div>
    );
  }

  const servedBy = (team.data ?? []).filter((m) => m.role === 'agency_member' && !m.pending && m.client_ids.includes(clientId));

  return (
    <div>
      <Link to="/agencia/clientes" className="text-sm text-lilac">‹ Clientes</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.data.name} color={client.data.color} />
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white">{client.data.name}</h1>
            <p className="text-sm text-muted">
              {client.data.specialty ?? 'sem especialidade'}
              {client.data.contact_email ? ` · ${client.data.contact_email}` : ''}
            </p>
            <p className="text-xs text-dim">
              {servedBy.length ? `Atendido por ${servedBy.map((m) => m.full_name).join(', ')}` : 'Nenhuma pessoa da equipe atribuída (o admin vê tudo).'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
          ) : null}
          {tab === 'posts' ? (
            <Link to={`/agencia/clientes/${clientId}/posts/novo`}>
              <Button>+ Novo post</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cx('-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold', tab === k ? 'border-violet text-white' : 'border-transparent text-muted')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {tab === 'posts' ? <PostCalendar clientId={clientId} linkTo={(p) => `/agencia/posts/${p.id}`} statuses={ALL_STATUSES} /> : null}
        {tab === 'relatorios' ? <AgencyReports clientId={clientId} /> : null}
        {tab === 'arquivos' ? <FolderBrowser clientId={clientId} /> : null}
        {tab === 'usuarios' ? <ClientUsers clientId={clientId} /> : null}
        {tab === 'financeiro' ? <ClienteFinanceiro key={client.data.id} client={client.data} /> : null}
      </div>

      {editing ? <EditClientModal client={client.data} onClose={() => setEditing(false)} /> : null}
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
                <p className="font-semibold text-white">{u.full_name}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <span className="text-xs text-lilac">{ROLE_LABEL[u.role]}</span>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Ninguém da clínica tem acesso ainda" text="Convide o dono ou a recepção para começar a aprovar posts." />
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
    color: client.color ?? '#8B5CF6',
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
