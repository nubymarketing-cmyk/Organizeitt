import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { usePosts } from '../../hooks/usePosts';
import { formatDateTime } from '../../lib/format';
import { Button, Card, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';

/** Uma pergunta só: "O que você precisa fazer agora?" */
export function InicioPage() {
  const { data: profile } = useSession();
  const posts = usePosts({ clientId: profile?.client_id ?? undefined });

  const words = profile?.full_name.split(' ') ?? [];
  const firstName = /^Dra?\.$/.test(words[0] ?? '') ? words.slice(0, 2).join(' ') : words[0];
  const canApprove = profile?.role === 'client_owner';
  const pending = (posts.data ?? []).filter((p) => p.status === 'awaiting_approval');
  const now = new Date().toISOString();
  const upcoming = (posts.data ?? [])
    .filter((p) => p.scheduled_at && p.scheduled_at >= now && p.status !== 'published' && p.status !== 'awaiting_approval')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-white">Olá, {firstName}</h1>
        <p className="text-sm text-muted">O que você precisa fazer agora?</p>
      </div>

      {posts.isLoading ? (
        <Skeleton className="h-48" />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : pending.length && canApprove ? (
        <Card className="border-violet/40 bg-violet/10 p-6 text-center">
          <p className="font-display text-5xl font-extrabold text-white">{pending.length}</p>
          <p className="mt-1 text-lg font-bold text-white">
            {pending.length === 1 ? 'Você tem 1 post para aprovar' : `Você tem ${pending.length} posts para aprovar`}
          </p>
          <p className="mt-1 text-sm text-muted">Leva menos de um minuto por post.</p>
          <Link to="/app/aprovar" className="mt-5 block">
            <Button className="min-h-[56px] w-full text-base">Revisar agora</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="font-display text-2xl font-extrabold text-ok">Tudo em dia</p>
          <p className="mt-1 text-sm text-muted">
            {pending.length
              ? `${pending.length} post${pending.length > 1 ? 's esperam' : ' espera'} o ok do responsável pela clínica.`
              : 'Nada esperando por você. A equipe avisa quando tiver post novo.'}
          </p>
        </Card>
      )}

      {!posts.isLoading && !posts.isError ? (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-base font-bold text-white">Próximos posts</h2>
            <Link to="/app/posts" className="flex min-h-[44px] items-center text-sm text-lilac">
              ver todos
            </Link>
          </div>
          {upcoming.length ? (
            <div className="space-y-2">
              {upcoming.map((p) => (
                <Link key={p.id} to={`/app/posts/${p.id}`} className="block">
                  <Card className="flex min-h-[64px] items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{p.title}</p>
                      <p className="text-xs text-muted">{formatDateTime(p.scheduled_at)}</p>
                    </div>
                    <StatusBadge status={p.status} friendly />
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nada agendado ainda" text="Quando a equipe agendar novos posts, eles aparecem aqui." />
          )}
        </section>
      ) : null}
    </div>
  );
}
