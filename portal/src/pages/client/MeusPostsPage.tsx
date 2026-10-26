import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { usePosts } from '../../hooks/usePosts';
import { NETWORK_LABEL, formatDateTime } from '../../lib/format';
import type { Post } from '../../types/database';
import { Button, Card, EmptyState, ErrorState, PageHeader, SkeletonList, StatusBadge } from '../../components/ui';

const PUBLISHED_STEP = 10;

/** Posts da clínica em três grupos simples, sem filtros nem tabela. */
export function MeusPostsPage() {
  const { data: profile } = useSession();
  const posts = usePosts({ clientId: profile?.client_id ?? undefined });
  const [publishedShown, setPublishedShown] = useState(PUBLISHED_STEP);

  const all = posts.data ?? [];
  const waiting = all.filter((p) => p.status === 'awaiting_approval');
  const next = all.filter((p) => p.status === 'changes_requested' || p.status === 'approved');
  const published = all.filter((p) => p.status === 'published').reverse();
  const isOwner = profile?.role === 'client_owner';

  return (
    <div>
      <PageHeader title="Meus posts" subtitle="O que espera seu ok, o que vem por aí e o que já foi ao ar." />
      {posts.isLoading ? (
        <SkeletonList rows={4} />
      ) : posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : !all.length ? (
        <EmptyState title="Nenhum post ainda" text="Assim que a equipe preparar o primeiro post, ele aparece aqui para você ver." />
      ) : (
        <div className="space-y-7">
          {waiting.length ? (
            <Group title={isOwner ? 'Esperando seu ok' : 'Esperando o ok do responsável'} posts={waiting}>
              {isOwner ? (
                <Link to="/app/aprovar" className="block">
                  <Button className="w-full">Revisar agora</Button>
                </Link>
              ) : null}
            </Group>
          ) : null}
          <Group title="Vem por aí" posts={next} empty="Nada aprovado esperando para ir ao ar." />
          <Group title="Já no ar" posts={published.slice(0, publishedShown)} empty="Nenhum post publicado ainda.">
            {published.length > publishedShown ? (
              <Button variant="secondary" className="w-full" onClick={() => setPublishedShown((n) => n + PUBLISHED_STEP)}>
                Ver mais
              </Button>
            ) : null}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ title, posts, empty, children }: { title: string; posts: Post[]; empty?: string; children?: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-bold text-white">{title}</h2>
      {posts.length ? (
        <div className="space-y-2">
          {posts.map((p) => (
            <Link key={p.id} to={`/app/posts/${p.id}`} className="block">
              <Card className="flex min-h-[64px] items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{p.title}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(p.scheduled_at)} · {NETWORK_LABEL[p.network]}
                  </p>
                </div>
                <StatusBadge status={p.status} friendly />
              </Card>
            </Link>
          ))}
          {children}
        </div>
      ) : (
        <p className="text-sm text-dim">{empty}</p>
      )}
    </section>
  );
}
