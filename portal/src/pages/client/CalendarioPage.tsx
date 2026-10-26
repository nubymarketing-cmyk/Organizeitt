import { useSession } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui';
import { PostCalendar } from '../../components/PostCalendar';

export function CalendarioPage() {
  const { data: profile } = useSession();
  if (!profile?.client_id) return null;
  return (
    <div>
      <PageHeader title="Calendário" subtitle="Tudo o que vai ao ar e o que espera seu ok." />
      <PostCalendar
        clientId={profile.client_id}
        linkTo={(p) => `/app/posts/${p.id}`}
        statuses={['awaiting_approval', 'changes_requested', 'approved', 'published']}
      />
    </div>
  );
}
