import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useClient, useClientUsers, useDeactivateClient } from '../../hooks/useClients';
import { ROLE_LABEL } from '../../lib/format';
import type { PostStatus } from '../../types/database';
import { Button, Card, EmptyState, ErrorState, InlineError, Skeleton, SkeletonList, cx } from '../../components/ui';
import { PostCalendar } from '../../components/PostCalendar';
import { FolderBrowser } from '../../components/FolderBrowser';
import { InviteUserModal } from '../../components/InviteUserModal';
import { AgencyReports } from './AgencyReports';

type Tab = 'posts' | 'relatorios' | 'arquivos' | 'usuarios';
const TABS: Array<[Tab, string]> = [
  ['posts', 'Posts'],
  ['relatorios', 'Relatórios'],
  ['arquivos', 'Arquivos'],
  ['usuarios', 'Usuários'],
];
const ALL_STATUSES: PostStatus[] = ['in_creation', 'awaiting_approval', 'changes_requested', 'approved', 'published'];

export function ClienteDetalhePage() {
  const { clientId } = useParams();
  const client = useClient(clientId);
  const [tab, setTab] = useState<Tab>('posts');

  if (client.isLoading) return <Skeleton className="h-40" />;
  if (client.isError || !client.data || !clientId) {
    return (
      <div className="space-y-4">
        <Link to="/agencia" className="text-sm text-lilac">‹ Clientes</Link>
        <ErrorState error={client.error} onRetry={() => client.refetch()} />
      </div>
    );
  }

  return (
    <div>
      <Link to="/agencia" className="text-sm text-lilac">‹ Clientes</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">{client.data.name}</h1>
          <p className="text-sm text-muted">
            {client.data.specialty ?? 'sem especialidade'}
            {client.data.contact_email ? ` · ${client.data.contact_email}` : ''}
          </p>
        </div>
        {tab === 'posts' ? (
          <Link to={`/agencia/clientes/${clientId}/posts/novo`}>
            <Button>+ Novo post</Button>
          </Link>
        ) : null}
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, label]) => (
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
      </div>
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

      <div className="border-t border-line pt-4">
        <Button
          variant="danger"
          loading={deactivate.isPending}
          onClick={() => {
            if (window.confirm('Desativar este cliente? Os dados ficam guardados, mas ele some da lista.')) {
              deactivate.mutate(clientId, { onSuccess: () => navigate('/agencia') });
            }
          }}
        >
          Desativar cliente
        </Button>
        <InlineError error={deactivate.error} />
      </div>

      <InviteUserModal open={inviting} onClose={() => setInviting(false)} clientId={clientId} />
    </div>
  );
}
