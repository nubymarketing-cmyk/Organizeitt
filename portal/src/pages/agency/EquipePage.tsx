import { useState } from 'react';
import { useSession } from '../../hooks/useAuth';
import { useSetMemberClients, useTeam } from '../../hooks/useAgency';
import { useClients } from '../../hooks/useClients';
import { ROLE_LABEL, initials } from '../../lib/format';
import type { TeamMember } from '../../services/agency';
import { Button, Card, EmptyState, ErrorState, InlineError, PageHeader, SkeletonList } from '../../components/ui';
import { ClientChecklist, InviteUserModal } from '../../components/InviteUserModal';

/** Equipe da agência e quais clientes cada pessoa atende. Só o admin. */
export function EquipePage() {
  const { data: profile } = useSession();
  const team = useTeam();
  const clients = useClients();
  const [inviting, setInviting] = useState(false);

  if (profile?.role !== 'agency_admin') {
    return <EmptyState title="Só o admin da agência acessa a equipe" text="Peça ao admin para ajustar quem atende cada cliente." />;
  }

  const others = (team.data ?? []).filter((m) => m.id !== profile.id);

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle="O admin vê todos os clientes. Cada pessoa da equipe vê só os clientes marcados para ela."
        action={<Button onClick={() => setInviting(true)}>Convidar pessoa</Button>}
      />

      {team.isLoading || clients.isLoading ? (
        <SkeletonList rows={3} />
      ) : team.isError ? (
        <ErrorState error={team.error} onRetry={() => team.refetch()} />
      ) : !others.length ? (
        <EmptyState
          title="Só você na equipe por enquanto"
          text="Convide designers e social media e escolha quais clientes cada um atende."
          action={<Button onClick={() => setInviting(true)}>Convidar a primeira pessoa</Button>}
        />
      ) : (
        <div className="space-y-3">
          {others.map((m) => (
            <MemberCard key={m.id} member={m} clients={clients.data ?? []} />
          ))}
        </div>
      )}

      <InviteUserModal open={inviting} onClose={() => setInviting(false)} defaultRole="agency_member" />
    </div>
  );
}

function MemberCard({ member, clients }: { member: TeamMember; clients: Array<{ id: string; name: string }> }) {
  const save = useSetMemberClients();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(member.client_ids);
  const isMember = member.role === 'agency_member';
  const names = clients.filter((c) => member.client_ids.includes(c.id)).map((c) => c.name);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
            {initials(member.full_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{member.full_name}</p>
            <p className="truncate text-xs text-muted">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {member.pending ? <span className="rounded-full bg-warn/15 px-2.5 py-1 font-bold text-warn">convite pendente</span> : null}
          <span className="text-lilac">{ROLE_LABEL[member.role]}</span>
        </div>
      </div>

      {isMember ? (
        <div className="mt-3 border-t border-line pt-3">
          {editing ? (
            <div className="space-y-3">
              <ClientChecklist clients={clients} selected={selected} onChange={setSelected} />
              <InlineError error={save.error} />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelected(member.client_ids);
                    setEditing(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  loading={save.isPending}
                  onClick={() => save.mutate({ profileId: member.id, clientIds: selected }, { onSuccess: () => setEditing(false) })}
                >
                  Salvar clientes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">
                {names.length ? `Atende: ${names.join(', ')}` : 'Nenhum cliente atribuído. Esta pessoa ainda não vê nada.'}
              </p>
              {member.pending ? (
                <span className="text-xs text-dim">Dá para mudar depois do primeiro acesso.</span>
              ) : (
                <Button variant="ghost" onClick={() => setEditing(true)}>
                  Escolher clientes
                </Button>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
