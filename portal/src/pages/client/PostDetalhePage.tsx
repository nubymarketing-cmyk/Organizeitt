import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApprovePost, usePost, useRequestChanges } from '../../hooks/usePosts';
import { FORMAT_LABEL, NETWORK_LABEL, formatDateTime } from '../../lib/format';
import { Button, Card, ErrorState, InlineError, Skeleton, StatusBadge, Textarea } from '../../components/ui';
import { CommentThread, MediaCarousel, VersionHistory } from '../../components/PostParts';

export function PostDetalhePage() {
  const { id } = useParams();
  const post = usePost(id);
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
        <Link to="/app/calendario" className="text-sm text-lilac">‹ Voltar</Link>
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
      <Link to="/app/calendario" className="text-sm text-lilac">‹ Voltar</Link>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <StatusBadge status={p.status} />
          {p.current_version > 1 ? <span className="text-xs text-dim">versão {p.current_version}</span> : null}
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">{p.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {formatDateTime(p.scheduled_at)} · {NETWORK_LABEL[p.network]} · {FORMAT_LABEL[p.format]}
        </p>
      </div>

      <MediaCarousel media={current?.media ?? []} />

      <Card>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Legenda</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-white">{current?.caption || p.caption || 'sem legenda'}</p>
      </Card>

      {awaiting ? (
        <Card className="border-violet/40 bg-violet/10">
          {asking ? (
            <div className="space-y-3">
              <p className="font-semibold text-white">O que precisa mudar?</p>
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
                  ENVIAR PEDIDO DE AJUSTE
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-white">Este post está esperando o seu ok.</p>
              <InlineError error={approve.error} />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAsking(true)} disabled={busy}>
                  PEDIR AJUSTE
                </Button>
                <Button className="flex-1" loading={approve.isPending} onClick={() => approve.mutate(p.id)}>
                  APROVAR
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
