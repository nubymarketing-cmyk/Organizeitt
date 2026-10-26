import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { usePosts } from '../../hooks/usePosts';
import { useReports } from '../../hooks/useReports';
import { formatDateTime, monthLabel, NETWORK_LABEL, FORMAT_LABEL } from '../../lib/format';
import { Card, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { ReportIndicators, findPreviousMonth } from '../../components/ReportIndicators';

export function InicioPage() {
  const { data: profile } = useSession();
  const posts = usePosts({ clientId: profile?.client_id ?? undefined });
  const reports = useReports(profile?.client_id);

  const words = profile?.full_name.split(' ') ?? [];
  const firstName = /^Dra?\.$/.test(words[0] ?? '') ? words.slice(0, 2).join(' ') : words[0];
  const pending = (posts.data ?? []).filter((p) => p.status === 'awaiting_approval');
  const now = new Date().toISOString();
  const upcoming = (posts.data ?? [])
    .filter((p) => p.scheduled_at && p.scheduled_at >= now && p.status !== 'published')
    .slice(0, 4);
  const latest = reports.data?.[0];
  const previous = latest ? findPreviousMonth(reports.data ?? [], latest) : undefined;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold text-white">Olá, {firstName}</h1>

      {/* Precisa de você */}
      {posts.isLoading ? (
        <Skeleton className="h-24" />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : (
        <Link to={pending[0] ? `/app/posts/${pending[0].id}` : '/app/calendario'} className="block">
          <Card className={pending.length ? 'border-violet/40 bg-violet/10' : ''}>
            <p className="text-xs font-semibold uppercase tracking-wider text-lilac">Precisa de você</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-lg font-bold text-white">
                {pending.length
                  ? `${pending.length} post${pending.length > 1 ? 's' : ''} esperando seu ok`
                  : 'Tudo aprovado, nada pendente'}
              </p>
              <span className="text-2xl text-lilac">›</span>
            </div>
            {pending.length ? <p className="mt-1 text-sm text-muted">Toque para revisar e aprovar.</p> : null}
          </Card>
        </Link>
      )}

      {/* Último relatório */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-base font-bold text-white">
            {latest ? `Resultados de ${monthLabel(latest.month)}` : 'Resultados'}
          </h2>
          {latest ? (
            <Link to="/app/relatorios" className="text-xs text-lilac">
              ver relatórios
            </Link>
          ) : null}
        </div>
        {reports.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : reports.isError ? (
          <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
        ) : latest ? (
          <ReportIndicators report={latest} previous={previous} compact />
        ) : (
          <EmptyState title="Primeiro mês" text="Seu primeiro relatório aparece aqui assim que a equipe fechar o mês." />
        )}
      </section>

      {/* Próximos posts */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-base font-bold text-white">Próximos posts</h2>
          <Link to="/app/calendario" className="text-xs text-lilac">
            ver calendário
          </Link>
        </div>
        {posts.isLoading ? (
          <Skeleton className="h-32" />
        ) : posts.isError ? null : upcoming.length ? (
          <div className="space-y-2">
            {upcoming.map((p) => (
              <Link key={p.id} to={`/app/posts/${p.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{p.title}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(p.scheduled_at)} · {NETWORK_LABEL[p.network]} · {FORMAT_LABEL[p.format]}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Nada agendado ainda" text="Quando a equipe agendar novos posts eles aparecem aqui." />
        )}
      </section>
    </div>
  );
}
