import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Network, Post, PostFormat, PostStatus } from '../../types/database';
import {
  useCreatePost,
  useCreateVersion,
  useDeletePost,
  useMarkPublished,
  usePost,
  useReturnToCreation,
  useSetPostAssignee,
  useSetPostStatus,
  useSubmitPost,
  useUpdatePost,
  useUploadPostMedia,
} from '../../hooks/usePosts';
import { useSession } from '../../hooks/useAuth';
import { useTeam } from '../../hooks/useAgency';
import { useClient } from '../../hooks/useClients';
import { FORMAT_LABEL, NETWORK_LABEL, STATUS_HEX, STATUS_LABEL } from '../../lib/format';
import { Button, Card, ConfirmButton, Dropdown, ErrorState, Field, InlineError, Input, MediaView, Skeleton, StatusBadge, Textarea } from '../../components/ui';
import { Icon } from '../../components/icons';
import { InstagramPreview } from '../../components/client/InstagramPreview';
import { CommentThread, VersionHistory } from '../../components/PostParts';

interface FormState {
  title: string;
  caption: string;
  network: Network;
  format: PostFormat;
  scheduled_at: string; // valor do input datetime-local
  media: string[];
  status: PostStatus;
  assignee_id: string;
}

const EMPTY: FormState = { title: '', caption: '', network: 'instagram', format: 'imagem', scheduled_at: '', media: [], status: 'in_creation', assignee_id: '' };

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
        <Link to="/agencia/clientes" className="text-sm text-lilac">‹ Clientes</Link>
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
  // Novo post a partir do calendário: ?data=YYYY-MM-DD já preenche a data, às 10h.
  const [params] = useSearchParams();
  const presetDay = /^\d{4}-\d{2}-\d{2}$/.test(params.get('data') ?? '') ? params.get('data') : null;
  const client = useClient(clientId);
  const { data: profile } = useSession();
  const team = useTeam();
  // Responsável: admin ou alguém da equipe que atende este cliente.
  const assignees = (team.data ?? []).filter(
    (m) => !m.pending && (m.role === 'agency_admin' || (m.role === 'agency_member' && m.client_ids.includes(clientId))),
  );
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
          status: p.status,
          assignee_id: p.assignee_id ?? '',
        }
      : { ...EMPTY, assignee_id: profile?.id ?? '', scheduled_at: presetDay ? `${presetDay}T10:00` : '' },
  );
  // Botões de fluxo (enviar, publicar, voltar) mudam o status salvo: o campo acompanha.
  const savedStatus = p?.status;
  useEffect(() => {
    if (savedStatus) setForm((f) => ({ ...f, status: savedStatus }));
  }, [savedStatus]);
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
  // Quem já é responsável continua na lista, mesmo que não atenda mais este cliente.
  const assigneeOptions = [
    { value: 'none', label: 'Ninguém' },
    ...assignees.map((m) => ({ value: m.id, label: m.full_name })),
    ...(form.assignee_id && !assignees.some((m) => m.id === form.assignee_id)
      ? [{ value: form.assignee_id, label: team.data?.find((m) => m.id === form.assignee_id)?.full_name ?? 'Responsável atual' }]
      : []),
  ];
  const setStatus = useSetPostStatus();
  const setAssignee = useSetPostAssignee();
  const remove = useDeletePost();
  const fileInput = useRef<HTMLInputElement>(null);

  const status = p?.status ?? 'in_creation';
  const contentEditable = status === 'in_creation' || status === 'changes_requested';
  const busy =
    create.isPending || update.isPending || submit.isPending || newVersion.isPending || publish.isPending || back.isPending ||
    setStatus.isPending || setAssignee.isPending || remove.isPending;
  const statusChanged = !!p && form.status !== p.status;
  const assigneeChanged = !!p && form.assignee_id !== (p.assignee_id ?? '');
  const lastChangeRequest = [...(detail?.comments ?? [])].reverse().find((c) => c.kind === 'change_request');

  const payload = () => ({
    title: form.title,
    caption: form.caption,
    network: form.network,
    format: form.format,
    scheduled_at: fromLocalInput(form.scheduled_at),
    media: form.media,
  });

  // Salva os dados e depois aplica responsável e status, se mudaram.
  // Cada etapa mostra o próprio erro; um erro interrompe as seguintes.
  const save = async () => {
    try {
      if (!p) {
        const created = await create.mutateAsync({ ...payload(), client_id: clientId });
        if (form.assignee_id) await setAssignee.mutateAsync({ id: created.id, assigneeId: form.assignee_id });
        if (form.status !== 'in_creation') await setStatus.mutateAsync({ id: created.id, status: form.status });
        navigate(`/agencia/posts/${created.id}`, { replace: true });
        return;
      }
      await update.mutateAsync({ id: p.id, input: payload() });
      if (assigneeChanged) await setAssignee.mutateAsync({ id: p.id, assigneeId: form.assignee_id || null });
      if (statusChanged) await setStatus.mutateAsync({ id: p.id, status: form.status });
      setSavedMsg(true);
    } catch {
      // o erro já aparece na tela pelo estado da mutação
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

  const error =
    create.error || update.error || submit.error || newVersion.error || publish.error || back.error || upload.error ||
    setStatus.error || setAssignee.error || remove.error;

  const flowAction =
    p && status === 'in_creation' ? (
      <Button
        className="w-full"
        disabled={busy}
        loading={submit.isPending}
        onClick={() => update.mutate({ id: p.id, input: payload() }, { onSuccess: () => submit.mutate(p.id) })}
      >
        Enviar para aprovação
      </Button>
    ) : p && status === 'changes_requested' ? (
      <Button
        className="w-full"
        disabled={busy}
        loading={newVersion.isPending}
        onClick={() =>
          update.mutate(
            { id: p.id, input: payload() },
            { onSuccess: () => newVersion.mutate({ id: p.id, caption: form.caption, media: form.media }) },
          )
        }
      >
        Enviar nova versão (v{p.current_version + 1})
      </Button>
    ) : p && status === 'approved' ? (
      <Button className="w-full" disabled={busy} loading={publish.isPending} onClick={() => publish.mutate(p.id)}>
        Marcar como publicado
      </Button>
    ) : null;
  const canSave = status !== 'changes_requested' || statusChanged || assigneeChanged;

  return (
    <div className="space-y-6">
      <Link to={`/agencia/clientes/${clientId}`} className="inline-flex min-h-[44px] items-center gap-1 text-sm text-link">
        <Icon name="chevronLeft" className="h-4 w-4" />
        {client.data?.name ?? 'Cliente'}
      </Link>

      <div className="-mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg">{p ? p.title : 'Novo post'}</h1>
          {p ? (
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={p.status} />
              <span className="text-xs text-dim">versão {p.current_version}</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">Para {client.data?.name ?? 'o cliente'}. Começa em criação; o cliente só vê depois de enviado.</p>
          )}
        </div>
        {canSave ? (
          <Button variant={p ? 'secondary' : 'primary'} loading={create.isPending || update.isPending} disabled={busy} onClick={() => void save()}>
            {p ? 'Salvar alterações' : 'Criar post'}
          </Button>
        ) : null}
      </div>

      {status === 'changes_requested' && lastChangeRequest ? (
        <Card className="border-bad/30 bg-bad/5">
          <p className="text-sm font-semibold text-bad">Ajuste pedido por {lastChangeRequest.author_name}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-fg">{lastChangeRequest.body}</p>
          <p className="mt-2 text-xs text-muted">Edite a legenda e a mídia e envie como nova versão.</p>
        </Card>
      ) : null}

      <InlineError error={error} />
      {savedMsg ? <p className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok">Alterações salvas.</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Conteúdo */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <Field label="Título">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: 5 mitos sobre clareamento" />
            </Field>

            {contentEditable ? (
              <>
                <Field label="Legenda" hint={`${form.caption.length} caracteres`}>
                  <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="min-h-[160px]" />
                </Field>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-fg">Mídia</p>
                  <p className="mb-2 text-xs text-dim">Na ordem do carrossel. Imagens até 10 MB, vídeos até 100 MB.</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {form.media.map((m, i) => (
                      <div key={m} className="group relative overflow-hidden rounded-xl border border-line">
                        <MediaView path={m} className="aspect-square w-full" />
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 text-[11px] font-semibold text-white">{i + 1}</span>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1 text-white">
                          <button className="flex h-8 w-8 items-center justify-center" onClick={() => moveMedia(i, -1)} aria-label="Mover para a esquerda">
                            <Icon name="chevronLeft" className="h-4 w-4" />
                          </button>
                          <button
                            className="px-1 text-xs font-semibold text-white"
                            onClick={() => setForm({ ...form, media: form.media.filter((x) => x !== m) })}
                            aria-label={`Remover mídia ${i + 1}`}
                          >
                            <Icon name="x" className="h-4 w-4" />
                          </button>
                          <button className="flex h-8 w-8 items-center justify-center" onClick={() => moveMedia(i, 1)} aria-label="Mover para a direita">
                            <Icon name="chevronRight" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInput.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-sm font-medium text-link transition hover:border-brand/50 hover:bg-brand/5"
                      disabled={upload.isPending}
                    >
                      <Icon name="plus" />
                      {upload.isPending ? 'enviando…' : 'Adicionar'}
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
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-fg/[.03] p-3 text-sm text-muted">
                Legenda e mídia estão travadas enquanto o post está com o cliente. Para mudar, use "Voltar para criação".
              </div>
            )}
          </Card>

          {p && detail ? (
            <>
              <CommentThread postId={p.id} comments={detail.comments} />
              <VersionHistory versions={detail.versions} current={p.current_version} />
            </>
          ) : null}
        </div>

        {/* Detalhes, prévia e ações */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="space-y-4">
            <h2 className="font-display text-base font-bold text-fg">Detalhes</h2>
            <Field label="Data e hora">
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rede" group>
                <Dropdown
                  field
                  label="Rede"
                  value={form.network}
                  onChange={(v) => setForm({ ...form, network: v as Network })}
                  options={(Object.keys(NETWORK_LABEL) as Network[]).map((n) => ({ value: n, label: NETWORK_LABEL[n] }))}
                />
              </Field>
              <Field label="Formato" group>
                <Dropdown
                  field
                  label="Formato"
                  value={form.format}
                  onChange={(v) => setForm({ ...form, format: v as PostFormat })}
                  options={(Object.keys(FORMAT_LABEL) as PostFormat[]).map((f) => ({ value: f, label: FORMAT_LABEL[f] }))}
                />
              </Field>
            </div>
            <Field label="Responsável" group>
              <Dropdown
                field
                label="Responsável"
                value={form.assignee_id || 'none'}
                onChange={(v) => setForm({ ...form, assignee_id: v === 'none' ? '' : v })}
                options={assigneeOptions}
              />
            </Field>
            <Field
              label="Status"
              group
              hint={
                statusChanged || (!p && form.status !== 'in_creation')
                  ? `${form.status === 'in_creation' ? 'Em criação o cliente não vê o post.' : 'O cliente passa a ver o post com este status.'} Vale ao salvar.`
                  : undefined
              }
            >
              <Dropdown
                field
                label="Status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as PostStatus })}
                options={(Object.keys(STATUS_LABEL) as PostStatus[]).map((st) => ({ value: st, label: STATUS_LABEL[st], dot: STATUS_HEX[st] }))}
              />
            </Field>
          </Card>

          {p ? (
            <Card className="space-y-2">
              <h2 className="font-display text-base font-bold text-fg">Próximo passo</h2>
              {flowAction ?? (
                <p className="text-sm text-muted">
                  {status === 'awaiting_approval' ? 'Esperando o cliente aprovar ou pedir ajuste. Ele foi avisado.' : 'Post publicado. Nada mais a fazer.'}
                </p>
              )}
              {status !== 'in_creation' ? (
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
            </Card>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-fg">Como fica no feed</p>
            <InstagramPreview
              clientName={client.data?.name ?? ''}
              media={contentEditable ? form.media : (current?.media ?? [])}
              caption={contentEditable ? form.caption : (current?.caption ?? '')}
            />
          </div>

          {p ? (
            <ConfirmButton
              variant="danger"
              disabled={busy}
              loading={remove.isPending}
              label="Excluir post"
              question="Excluir este post? Versões, comentários e mídias somem e não dá para desfazer."
              confirmLabel="Excluir"
              onConfirm={() => remove.mutate(p.id, { onSuccess: () => navigate(`/agencia/clientes/${clientId}`, { replace: true }) })}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
