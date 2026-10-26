import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { useMyAgency } from '../../hooks/useAgency';
import { useClient } from '../../hooks/useClients';
import { useApprovePost, usePost, usePosts, useRequestChanges } from '../../hooks/usePosts';
import { brandStyle } from '../../lib/brand';
import { formatDateTime } from '../../lib/format';
import { Button, ErrorState, InlineError, Skeleton, Textarea } from '../../components/ui';
import { InstagramPreview } from '../../components/client/InstagramPreview';

/** Aprovação em tela cheia, um post por vez. Avança sozinho para o próximo. */
export function AprovarPage() {
  const { data: profile } = useSession();
  const agency = useMyAgency();
  const posts = usePosts({ clientId: profile?.client_id ?? undefined, status: 'awaiting_approval' });
  // A fila é fixada ao abrir, para a lista não mudar de lugar enquanto a pessoa revisa.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState({ approved: 0, changes: 0 });

  useEffect(() => {
    if (queue === null && posts.data) setQueue(posts.data.map((p) => p.id));
  }, [posts.data, queue]);

  if (profile && profile.role !== 'client_owner') return <Navigate to="/app/posts" replace />;

  return (
    <div className="min-h-screen bg-night" style={brandStyle(agency.data?.primary_color)}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-8 pt-4">
        <header className="mb-4 flex items-center justify-between">
          <Link to="/app" className="flex min-h-[44px] items-center text-sm text-lilac">
            ‹ Sair da revisão
          </Link>
          {queue?.length && index < queue.length ? (
            <span className="text-sm text-muted">
              {index + 1} de {queue.length}
            </span>
          ) : null}
        </header>

        {posts.isError ? (
          <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
        ) : queue === null ? (
          <Skeleton className="aspect-square w-full" />
        ) : index >= queue.length ? (
          <Finished approved={done.approved} changes={done.changes} empty={!queue.length} />
        ) : (
          <ReviewOne
            key={queue[index]}
            postId={queue[index]}
            onNext={(kind) => {
              setDone((d) => ({ ...d, [kind]: d[kind] + 1 }));
              setIndex((i) => i + 1);
            }}
            onSkip={() => setIndex((i) => i + 1)}
          />
        )}
      </div>
    </div>
  );
}

function ReviewOne({ postId, onNext, onSkip }: { postId: string; onNext: (kind: 'approved' | 'changes') => void; onSkip: () => void }) {
  const { data: profile } = useSession();
  const client = useClient(profile?.client_id);
  const post = usePost(postId);
  const approve = useApprovePost();
  const requestChanges = useRequestChanges();
  const [asking, setAsking] = useState(false);
  const [comment, setComment] = useState('');

  if (post.isLoading) return <Skeleton className="aspect-square w-full" />;
  if (post.isError || !post.data) {
    return (
      <div className="space-y-4">
        <ErrorState error={post.error} onRetry={() => post.refetch()} />
        <Button variant="secondary" className="w-full" onClick={onSkip}>
          Pular este post
        </Button>
      </div>
    );
  }
  const { post: p, versions } = post.data;
  const current = versions.find((v) => v.version_number === p.current_version);
  // Alguém já respondeu este post (outra aba ou outra pessoa): segue para o próximo.
  if (p.status !== 'awaiting_approval') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-white">Este post já foi revisado.</p>
        <Button className="w-full" onClick={onSkip}>
          Próximo
        </Button>
      </div>
    );
  }
  const busy = approve.isPending || requestChanges.isPending;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-lilac">Vai ao ar {formatDateTime(p.scheduled_at)}</p>
        <h1 className="font-display text-xl font-extrabold text-white">{p.title}</h1>
      </div>

      <InstagramPreview clientName={client.data?.name ?? ''} media={current?.media ?? []} caption={current?.caption ?? p.caption ?? ''} />

      <div className="mt-auto space-y-3 pt-2">
        {asking ? (
          <>
            <p className="font-semibold text-white">O que você quer mudar?</p>
            <Textarea
              autoFocus
              placeholder="Ex.: trocar a foto e deixar o texto mais curto"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <InlineError error={requestChanges.error} />
            <Button
              className="min-h-[56px] w-full text-base"
              loading={requestChanges.isPending}
              disabled={comment.trim().length < 5}
              onClick={() => requestChanges.mutate({ id: p.id, comment }, { onSuccess: () => onNext('changes') })}
            >
              Enviar pedido de ajuste
            </Button>
            <Button variant="ghost" className="w-full" disabled={busy} onClick={() => setAsking(false)}>
              Voltar
            </Button>
          </>
        ) : (
          <>
            <InlineError error={approve.error} />
            <Button
              className="min-h-[56px] w-full text-base"
              loading={approve.isPending}
              disabled={busy}
              onClick={() => approve.mutate(p.id, { onSuccess: () => onNext('approved') })}
            >
              Aprovar
            </Button>
            <Button variant="secondary" className="min-h-[56px] w-full text-base" disabled={busy} onClick={() => setAsking(true)}>
              Pedir ajuste
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Finished({ approved, changes, empty }: { approved: number; changes: number; empty: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ok/15 text-3xl text-ok">✓</div>
      <h1 className="font-display text-2xl font-extrabold text-white">{empty ? 'Nada para aprovar' : 'Pronto, você revisou tudo'}</h1>
      <p className="text-sm text-muted">
        {empty
          ? 'Quando a equipe mandar um post novo, ele aparece aqui.'
          : [approved ? `${approved} aprovado${approved > 1 ? 's' : ''}` : '', changes ? `${changes} com pedido de ajuste` : '']
              .filter(Boolean)
              .join(' e ') + '. A equipe já foi avisada.'}
      </p>
      <Button className="w-full" onClick={() => navigate('/app')}>
        Voltar ao início
      </Button>
    </div>
  );
}
