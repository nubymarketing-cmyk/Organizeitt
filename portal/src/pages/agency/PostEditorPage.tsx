import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Network, Post, PostFormat } from '../../types/database';
import {
  useCreatePost,
  useCreateVersion,
  useMarkPublished,
  usePost,
  useReturnToCreation,
  useSubmitPost,
  useUpdatePost,
  useUploadPostMedia,
} from '../../hooks/usePosts';
import { useClient } from '../../hooks/useClients';
import { FORMAT_LABEL, NETWORK_LABEL } from '../../lib/format';
import { Button, Card, ConfirmButton, ErrorState, Field, InlineError, Input, MediaView, Select, Skeleton, StatusBadge, Textarea } from '../../components/ui';
import { CommentThread, MediaCarousel, VersionHistory } from '../../components/PostParts';

interface FormState {
  title: string;
  caption: string;
  network: Network;
  format: PostFormat;
  scheduled_at: string; // valor do input datetime-local
  media: string[];
}

const EMPTY: FormState = { title: '', caption: '', network: 'instagram', format: 'imagem', scheduled_at: '', media: [] };

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}

/** Rota nova (/clientes/:clientId/posts/novo) ou edição (/posts/:id). */
export function PostEditorPage() {
  const { id, clientId: clientParam } = useParams();
  const post = usePost(id);

  if (id && post.isLoading) return <Skeleton className="h-96" />;
  if (id && (post.isError || !post.data)) {
    return (
      <div className="space-y-4">
        <Link to="/agencia" className="text-sm text-lilac">‹ Clientes</Link>
        <ErrorState error={post.error} onRetry={() => post.refetch()} />
      </div>
    );
  }
  const clientId = post.data?.post.client_id ?? clientParam;
  if (!clientId) return null;
  return <Editor key={post.data?.post.id ?? 'novo'} clientId={clientId} detail={post.data ?? null} />;
}

function Editor({ clientId, detail }: { clientId: string; detail: ReturnType<typeof usePost>['data'] | null }) {
  const navigate = useNavigate();
  const client = useClient(clientId);
  const p: Post | null = detail?.post ?? null;
  const current = detail?.versions.find((v) => v.version_number === p?.current_version);

  const [form, setForm] = useState<FormState>(() =>
    p
      ? {
          title: p.title,
          caption: current?.caption ?? p.caption ?? '',
          network: p.network,
          format: p.format,
          scheduled_at: toLocalInput(p.scheduled_at),
          media: current?.media ?? [],
        }
      : EMPTY,
  );
  const [savedMsg, setSavedMsg] = useState(false);
  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(false), 2500);
    return () => clearTimeout(t);
  }, [savedMsg]);

  const create = useCreatePost();
  const update = useUpdatePost();
  const submit = useSubmitPost();
  const newVersion = useCreateVersion();
  const publish = useMarkPublished();
  const back = useReturnToCreation();
  const upload = useUploadPostMedia();
  const fileInput = useRef<HTMLInputElement>(null);

  const status = p?.status ?? 'in_creation';
  const contentEditable = status === 'in_creation' || status === 'changes_requested';
  const busy = create.isPending || update.isPending || submit.isPending || newVersion.isPending || publish.isPending || back.isPending;
  const lastChangeRequest = [...(detail?.comments ?? [])].reverse().find((c) => c.kind === 'change_request');

  const payload = () => ({
    title: form.title,
    caption: form.caption,
    network: form.network,
    format: form.format,
    scheduled_at: fromLocalInput(form.scheduled_at),
    media: form.media,
  });

  const save = () => {
    if (!p) {
      create.mutate({ ...payload(), client_id: clientId }, { onSuccess: (created) => navigate(`/agencia/posts/${created.id}`, { replace: true }) });
    } else {
      update.mutate({ id: p.id, input: payload() }, { onSuccess: () => setSavedMsg(true) });
    }
  };

  const addMedia = async (files: File[]) => {
    for (const file of files) {
      const path = await upload.mutateAsync({ clientId, file }).catch(() => null);
      if (path) setForm((f) => ({ ...f, media: [...f.media, path] }));
    }
  };
  const moveMedia = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const m = [...f.media];
      const j = i + dir;
      if (j < 0 || j >= m.length) return f;
      [m[i], m[j]] = [m[j], m[i]];
      return { ...f, media: m };
    });

  const error = create.error || update.error || submit.error || newVersion.error || publish.error || back.error || upload.error;

  return (
    <div className="max-w-2xl space-y-6">
      <Link to={`/agencia/clientes/${clientId}`} className="text-sm text-lilac">
        ‹ {client.data?.name ?? 'Cliente'}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-white">{p ? p.title : 'Novo post'}</h1>
        {p ? (
          <div className="flex items-center gap-2">
            <StatusBadge status={p.status} />
            <span className="text-xs text-dim">versão {p.current_version}</span>
          </div>
        ) : null}
      </div>

      {status === 'changes_requested' && lastChangeRequest ? (
        <Card className="border-bad/30 bg-bad/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-bad">Ajuste pedido por {lastChangeRequest.author_name}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-white">{lastChangeRequest.body}</p>
          <p className="mt-2 text-xs text-muted">Edite a legenda e a mídia abaixo e envie como nova versão.</p>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <Field label="Título">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: 5 mitos sobre clareamento" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Rede">
            <Select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value as Network })}>
              {(Object.keys(NETWORK_LABEL) as Network[]).map((n) => (
                <option key={n} value={n}>{NETWORK_LABEL[n]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Formato">
            <Select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as PostFormat })}>
              {(Object.keys(FORMAT_LABEL) as PostFormat[]).map((f) => (
                <option key={f} value={f}>{FORMAT_LABEL[f]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data e hora">
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </Field>
        </div>

        {contentEditable ? (
          <>
            <Field label="Legenda">
              <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="min-h-[140px]" />
            </Field>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Mídia (na ordem do carrossel)</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.media.map((m, i) => (
                  <div key={m} className="relative overflow-hidden rounded-lg border border-line">
                    <MediaView path={m} className="aspect-square w-full" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-0.5 text-xs">
                      <button onClick={() => moveMedia(i, -1)} aria-label="Mover para a esquerda">‹</button>
                      <button className="text-bad" onClick={() => setForm({ ...form, media: form.media.filter((x) => x !== m) })}>
                        remover
                      </button>
                      <button onClick={() => moveMedia(i, 1)} aria-label="Mover para a direita">›</button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => fileInput.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-line text-sm text-lilac"
                  disabled={upload.isPending}
                >
                  {upload.isPending ? 'enviando…' : '+ mídia'}
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  void addMedia(picked);
                }}
              />
              <p className="mt-1 text-xs text-dim">Imagens até 10 MB, vídeos até 100 MB.</p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="max-w-xs">
              <MediaCarousel media={current?.media ?? []} />
            </div>
            <p className="whitespace-pre-line text-sm text-white">{current?.caption || 'sem legenda'}</p>
            <p className="text-xs text-dim">Para mudar legenda ou mídia, volte o post para criação.</p>
          </div>
        )}

        <InlineError error={error} />
        {savedMsg ? <p className="text-sm text-ok">Salvo.</p> : null}

        <div className="flex flex-wrap gap-2">
          {status !== 'changes_requested' ? (
            <Button variant="secondary" loading={create.isPending || update.isPending} disabled={busy} onClick={save}>
              {p ? 'Salvar' : 'Criar post'}
            </Button>
          ) : null}
          {p && status === 'in_creation' ? (
            <Button
              disabled={busy}
              loading={submit.isPending}
              onClick={() =>
                update.mutate({ id: p.id, input: payload() }, { onSuccess: () => submit.mutate(p.id) })
              }
            >
              Enviar para aprovação
            </Button>
          ) : null}
          {p && status === 'changes_requested' ? (
            <Button disabled={busy} loading={newVersion.isPending} onClick={() =>
                update.mutate({ id: p.id, input: payload() }, { onSuccess: () => newVersion.mutate({ id: p.id, caption: form.caption, media: form.media }) })
              }>
              Enviar nova versão (v{p.current_version + 1})
            </Button>
          ) : null}
          {p && status === 'approved' ? (
            <Button disabled={busy} loading={publish.isPending} onClick={() => publish.mutate(p.id)}>
              Marcar como publicado
            </Button>
          ) : null}
          {p && status !== 'in_creation' ? (
            <ConfirmButton
              variant="ghost"
              disabled={busy}
              loading={back.isPending}
              label="Voltar para criação"
              question="Voltar este post para criação? O cliente deixa de vê-lo até ser reenviado."
              confirmLabel="Voltar para criação"
              onConfirm={() => back.mutate(p.id)}
            />
          ) : null}
        </div>
      </Card>

      {p && detail ? (
        <>
          <CommentThread postId={p.id} comments={detail.comments} />
          <VersionHistory versions={detail.versions} current={p.current_version} />
        </>
      ) : null}
    </div>
  );
}
