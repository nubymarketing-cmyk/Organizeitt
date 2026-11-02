import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useApprovePost, usePost, useRequestChanges } from '../../hooks/usePosts';
import { NETWORK_LABEL, formatDateTime } from '../../lib/format';
import { useClient } from '../../hooks/useClients';
import { Button, Card, ErrorState, InlineError, Skeleton, StatusBadge, Textarea } from '../../components/ui';
import { CommentThread, VersionHistory } from '../../components/PostParts';
import { InstagramPreview } from '../../components/client/InstagramPreview';

export function PostDetalhePage() {
  const { id } = useParams();
  const post = usePost(id);
  const { data: profile } = useSession();
  // Equipe da clínica só visualiza e comenta; quem aprova é o dono.
  const canApprove = profile?.role === 'client_owner';
  const client = useClient(profile?.client_id);
  const approve = useApprovePost();
  const requestChanges = useRequestChanges();
  const [asking, setAsking] = useState(false);
  const [comment, setComment] = useState('');

  if (post.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (post.isError || !post.data) {
    return (
      <div className="space-y-4">
        <Link to="/app/posts" className="flex min-h-[44px] items-center text-sm text-lilac">‹ Meus posts</Link>
        <ErrorState error={post.error} onRetry={() => post.refetch()} />
      </div>
    );
  }

  const { post: p, versions, comments } = post.data;
  const current = versions.find((v) => v.version_number === p.current_version);
  const awaiting = p.status === 'awaiting_approval';
  const busy = approve.isPending || requestChanges.isPending;

  return (
    <div className="space-y-6">
      <Link to="/app/posts" className="flex min-h-[44px] items-center text-sm text-lilac">‹ Meus posts</Link>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <StatusBadge status={p.status} friendly />
          {p.current_version > 1 ? <span className="text-xs text-dim">versão {p.current_version}</span> : null}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg">{p.title}</h1>
        <p className="mt-1 text-sm text-muted">
          Vai ao ar {formatDateTime(p.scheduled_at)} · {NETWORK_LABEL[p.network]}
        </p>
      </div>

      <InstagramPreview clientName={client.data?.name ?? ''} media={current?.media ?? []} caption={current?.caption ?? p.caption ?? ''} />

      {awaiting && !canApprove ? (
        <Card className="text-sm text-muted">Este post está esperando o ok do responsável pela clínica. Se quiser, deixe um comentário abaixo.</Card>
      ) : awaiting ? (
        <Card className="border-violet/40 bg-violet/10">
          {asking ? (
            <div className="space-y-3">
              <p className="font-semibold text-fg">O que precisa mudar?</p>
              <Textarea
                autoFocus
                placeholder="Ex.: trocar a foto da capa e deixar o texto mais curto"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <InlineError error={requestChanges.error} />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAsking(false)} disabled={busy}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={requestChanges.isPending}
                  disabled={comment.trim().length < 5}
                  onClick={() =>
                    requestChanges.mutate(
                      { id: p.id, comment },
                      {
                        onSuccess: () => {
                          setAsking(false);
                          setComment('');
                        },
                      },
                    )
                  }
                >
                  Enviar pedido de ajuste
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-fg">Este post está esperando o seu ok.</p>
              <InlineError error={approve.error} />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAsking(true)} disabled={busy}>
                  Pedir ajuste
                </Button>
                <Button className="flex-1" loading={approve.isPending} onClick={() => approve.mutate(p.id)}>
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : p.status === 'changes_requested' ? (
        <Card className="text-sm text-muted">Seu pedido de ajuste chegou na equipe. A nova versão aparece aqui para você aprovar.</Card>
      ) : null}

      <CommentThread postId={p.id} comments={comments} />
      <VersionHistory versions={versions} current={p.current_version} />
    </div>
  );
}
