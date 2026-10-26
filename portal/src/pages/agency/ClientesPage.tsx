import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useClients, useCreateClient } from '../../hooks/useClients';
import { initials } from '../../lib/format';
import { Button, Card, EmptyState, ErrorState, Field, InlineError, Input, Modal, PageHeader, SkeletonList } from '../../components/ui';
import { InviteUserModal } from '../../components/InviteUserModal';

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
            <Link key={c.id} to={`/agencia/clientes/${c.id}`}>
              <Card className="h-full hover:border-violet/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-muted">{c.specialty ?? 'sem especialidade'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className={c.awaiting_count ? 'rounded-full bg-warn/15 px-2.5 py-1 text-warn' : 'rounded-full bg-white/5 px-2.5 py-1 text-dim'}>
                    {c.awaiting_count} aguardando
                  </span>
                  {c.changes_count ? (
                    <span className="rounded-full bg-bad/15 px-2.5 py-1 text-bad">{c.changes_count} com ajuste</span>
                  ) : null}
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-dim">
                    {c.users_count} usuário{c.users_count === 1 ? '' : 's'}
                  </span>
                </div>
              </Card>
            </Link>
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
