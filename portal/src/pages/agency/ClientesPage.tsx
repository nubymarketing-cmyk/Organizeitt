import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useClients, useCreateClient } from '../../hooks/useClients';
import { Button, Card, EmptyState, ErrorState, Field, InlineError, Input, Modal, PageHeader, SkeletonList, cx } from '../../components/ui';
import { InviteUserModal } from '../../components/InviteUserModal';
import { ClientAvatar } from '../../components/AgencyParts';
import type { ClientWithCounts, PaymentStatus } from '../../services/clients';

export function ClientesPage() {
  const { data: profile } = useSession();
  const clients = useClients();
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState('');

  const isAdmin = profile?.role === 'agency_admin';
  const list = (clients.data ?? []).filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));
  const pendingTotal = (clients.data ?? []).reduce((n, c) => n + c.awaiting_count, 0);

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={clients.data ? `${pendingTotal} post${pendingTotal === 1 ? '' : 's'} aguardando aprovação no total.` : undefined}
        action={
          <div className="flex gap-2">
            {isAdmin ? (
              <Button variant="secondary" onClick={() => setInviting(true)}>
                Convidar
              </Button>
            ) : null}
            {isAdmin ? <Button onClick={() => setCreating(true)}>+ Novo cliente</Button> : null}
          </div>
        }
      />

      <Input placeholder="Buscar clínica…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />

      {clients.isLoading ? (
        <SkeletonList rows={4} />
      ) : clients.isError ? (
        <ErrorState error={clients.error} onRetry={() => clients.refetch()} />
      ) : !list.length ? (
        <EmptyState
          title={search ? 'Nenhuma clínica encontrada' : isAdmin ? 'Nenhum cliente ainda' : 'Nenhum cliente atribuído a você'}
          text={
            search
              ? 'Confira o nome digitado.'
              : isAdmin
                ? 'Cadastre a primeira clínica para começar.'
                : 'Peça ao admin da agência para marcar os clientes que você atende, na tela Equipe.'
          }
          action={!search && isAdmin ? <Button onClick={() => setCreating(true)}>Cadastrar a primeira clínica</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <ClientCard key={c.id} client={c} showPayment={isAdmin} />
          ))}
        </div>
      )}

      <NewClientModal open={creating} onClose={() => setCreating(false)} />
      <InviteUserModal open={inviting} onClose={() => setInviting(false)} />
    </div>
  );
}

function NewClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateClient();
  const [form, setForm] = useState({ name: '', specialty: '', contact_email: '' });
  const close = () => {
    setForm({ name: '', specialty: '', contact_email: '' });
    create.reset();
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title="Novo cliente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form, { onSuccess: close });
        }}
      >
        <Field label="Nome da clínica">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </Field>
        <Field label="Especialidade">
          <Input placeholder="Odontologia, Psicologia…" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </Field>
        <Field label="E-mail de contato">
          <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </Field>
        <InlineError error={create.error} />
        <Button type="submit" className="w-full" loading={create.isPending}>
          Cadastrar
        </Button>
      </form>
    </Modal>
  );
}

const PAYMENT: Record<PaymentStatus, { label: string; cls: string }> = {
  none: { label: 'sem cobrança', cls: 'bg-white/5 text-dim' },
  open: { label: 'mensalidade a vencer', cls: 'bg-white/5 text-muted' },
  paid: { label: 'pagamento em dia', cls: 'bg-ok/15 text-ok' },
  overdue: { label: 'mensalidade vencida', cls: 'bg-bad/15 text-bad' },
};

function ClientCard({ client: c, showPayment }: { client: ClientWithCounts; showPayment: boolean }) {
  const late = c.overdue_count > 0;
  const progress = c.month_planned ? Math.round((c.month_published / c.month_planned) * 100) : 0;
  return (
    <Link to={`/agencia/clientes/${c.id}`}>
      <Card className="h-full hover:border-violet/40">
        <div className="flex items-center gap-3">
          <ClientAvatar name={c.name} color={c.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{c.name}</p>
            <p className="text-xs text-muted">{c.specialty ?? 'sem especialidade'}</p>
          </div>
          <span className={cx('rounded-full px-2.5 py-1 text-xs font-bold', late ? 'bg-bad/15 text-bad' : 'bg-ok/15 text-ok')}>
            {late ? 'atrasado' : 'em dia'}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted">Posts do mês</span>
            <span className="font-semibold text-white">
              {c.month_published} publicado{c.month_published === 1 ? '' : 's'} de {c.month_planned}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          {c.awaiting_count ? <span className="rounded-full bg-warn/15 px-2.5 py-1 text-warn">{c.awaiting_count} aguardando</span> : null}
          {c.changes_count ? <span className="rounded-full bg-bad/15 px-2.5 py-1 text-bad">{c.changes_count} com ajuste</span> : null}
          {late ? <span className="rounded-full bg-bad/15 px-2.5 py-1 text-bad">{c.overdue_count} atrasado{c.overdue_count === 1 ? '' : 's'}</span> : null}
          {!c.awaiting_count && !c.changes_count && !late ? <span className="rounded-full bg-white/5 px-2.5 py-1 text-dim">sem pendências</span> : null}
          {showPayment ? <span className={cx('rounded-full px-2.5 py-1', PAYMENT[c.payment_status].cls)}>{PAYMENT[c.payment_status].label}</span> : null}
        </div>
      </Card>
    </Link>
  );
}
