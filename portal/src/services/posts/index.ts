// Posts, versões e comentários.
// As funções de status espelham as RPCs da seção 5 (submit_post_for_approval,
// approve_post, request_post_changes, create_post_version, mark_post_published).
// Na Etapa 6 cada uma vira um supabase.rpc(...) com a mesma assinatura.

import type { Network, Post, PostComment, PostFormat, PostStatus, PostVersion } from '../../types/database';
import { AppError, canSeeRow, isStaff, profileName, requireClientUser, requireProfile, requireStaff, assertClientAccess } from '../mock/access';
import { db, delay, nowIso, uid } from '../mock/db';
import { uploadToStorage } from '../storage';

export interface PostFilters {
  clientId?: string;
  status?: PostStatus | 'all';
  network?: Network | 'all';
}

export interface CommentWithAuthor extends PostComment {
  author_name: string;
  author_is_staff: boolean;
}

export interface PostDetail {
  post: Post;
  versions: PostVersion[];
  comments: CommentWithAuthor[];
}

export interface PostInput {
  client_id: string;
  title: string;
  caption: string;
  network: Network;
  format: PostFormat;
  scheduled_at: string | null;
  media: string[];
}

function visible(post: Post): boolean {
  const p = requireProfile();
  if (!canSeeRow(p, post)) return false;
  // Cliente nunca vê posts em criação.
  if (!isStaff(p) && post.status === 'in_creation') return false;
  return true;
}

function findPost(id: string): Post {
  const post = db.posts.find((x) => x.id === id);
  if (!post || !visible(post)) throw new AppError('Post não encontrado.');
  return post;
}

function touch(post: Post, status?: PostStatus) {
  if (status) post.status = status;
  post.updated_at = nowIso();
}

export async function listPosts(filters: PostFilters = {}): Promise<Post[]> {
  const rows = db.posts
    .filter(visible)
    .filter((x) => !filters.clientId || x.client_id === filters.clientId)
    .filter((x) => !filters.status || filters.status === 'all' || x.status === filters.status)
    .filter((x) => !filters.network || filters.network === 'all' || x.network === filters.network)
    .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''));
  return delay(rows.map((x) => ({ ...x })));
}

export async function getPost(id: string): Promise<PostDetail> {
  const post = findPost(id);
  const versions = db.post_versions
    .filter((v) => v.post_id === id)
    .sort((a, b) => b.version_number - a.version_number);
  const comments = db.post_comments
    .filter((c) => c.post_id === id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((c) => {
      const author = db.profiles.find((p) => p.id === c.author_id);
      return { ...c, author_name: profileName(c.author_id), author_is_staff: author ? isStaff(author) : false };
    });
  return delay({ post: { ...post }, versions: versions.map((v) => ({ ...v })), comments });
}

export async function createPost(input: PostInput): Promise<Post> {
  const p = requireStaff();
  const client = assertClientAccess(p, input.client_id);
  if (!input.title.trim()) throw new AppError('Dê um título ao post.');
  const ts = nowIso();
  const post: Post = {
    id: uid(),
    created_at: ts,
    updated_at: ts,
    agency_id: client.agency_id,
    client_id: client.id,
    title: input.title.trim(),
    caption: input.caption,
    network: input.network,
    format: input.format,
    scheduled_at: input.scheduled_at,
    status: 'in_creation',
    current_version: 1,
    created_by: p.id,
  };
  db.posts.push(post);
  db.post_versions.push({
    id: uid(),
    created_at: ts,
    post_id: post.id,
    agency_id: post.agency_id,
    client_id: post.client_id,
    version_number: 1,
    caption: input.caption,
    media: input.media,
    created_by: p.id,
  });
  return delay({ ...post });
}

/** Edita dados do post. Legenda e mídia só mudam direto enquanto está em criação. */
export async function updatePost(id: string, input: Omit<PostInput, 'client_id'>): Promise<Post> {
  requireStaff();
  const post = findPost(id);
  if (!input.title.trim()) throw new AppError('Dê um título ao post.');
  post.title = input.title.trim();
  post.network = input.network;
  post.format = input.format;
  post.scheduled_at = input.scheduled_at;
  if (post.status === 'in_creation') {
    post.caption = input.caption;
    const v = db.post_versions.find((x) => x.post_id === id && x.version_number === post.current_version);
    if (v) {
      v.caption = input.caption;
      v.media = input.media;
    }
  }
  touch(post);
  return delay({ ...post });
}

export async function submitPostForApproval(id: string): Promise<Post> {
  requireStaff();
  const post = findPost(id);
  if (post.status !== 'in_creation') {
    throw new AppError('Só posts em criação podem ser enviados para aprovação.');
  }
  touch(post, 'awaiting_approval');
  return delay({ ...post });
}

export async function approvePost(id: string): Promise<Post> {
  const p = requireClientUser();
  const post = findPost(id);
  if (post.status !== 'awaiting_approval') {
    throw new AppError('Este post não está aguardando aprovação.');
  }
  touch(post, 'approved');
  db.post_comments.push({ id: uid(), created_at: nowIso(), post_id: id, agency_id: post.agency_id, client_id: post.client_id, author_id: p.id, body: 'Aprovado.', kind: 'approval' });
  return delay({ ...post });
}

export async function requestPostChanges(id: string, comment: string): Promise<Post> {
  const p = requireClientUser();
  const post = findPost(id);
  if (post.status !== 'awaiting_approval') {
    throw new AppError('Este post não está aguardando aprovação.');
  }
  if (comment.trim().length < 5) {
    throw new AppError('Conte o que precisa mudar (pelo menos 5 caracteres).');
  }
  touch(post, 'changes_requested');
  db.post_comments.push({ id: uid(), created_at: nowIso(), post_id: id, agency_id: post.agency_id, client_id: post.client_id, author_id: p.id, body: comment.trim(), kind: 'change_request' });
  return delay({ ...post });
}

export async function createPostVersion(id: string, caption: string, media: string[]): Promise<Post> {
  const p = requireStaff();
  const post = findPost(id);
  if (post.status !== 'changes_requested') {
    throw new AppError('Nova versão só pode ser enviada quando o cliente pediu ajuste.');
  }
  post.current_version += 1;
  post.caption = caption;
  db.post_versions.push({
    id: uid(),
    created_at: nowIso(),
    post_id: id,
    agency_id: post.agency_id,
    client_id: post.client_id,
    version_number: post.current_version,
    caption,
    media,
    created_by: p.id,
  });
  touch(post, 'awaiting_approval');
  return delay({ ...post });
}

export async function markPostPublished(id: string): Promise<Post> {
  requireStaff();
  const post = findPost(id);
  if (post.status !== 'approved') {
    throw new AppError('Só posts aprovados podem ser marcados como publicados.');
  }
  touch(post, 'published');
  return delay({ ...post });
}

/** Qualquer status -> em criação (retrabalho). Só agência. */
export async function returnPostToCreation(id: string): Promise<Post> {
  requireStaff();
  const post = findPost(id);
  if (post.status === 'in_creation') throw new AppError('O post já está em criação.');
  touch(post, 'in_creation');
  return delay({ ...post });
}

export async function addComment(postId: string, body: string): Promise<void> {
  const p = requireProfile();
  const post = findPost(postId);
  if (!body.trim()) throw new AppError('Escreva um comentário.');
  db.post_comments.push({ id: uid(), created_at: nowIso(), post_id: postId, agency_id: post.agency_id, client_id: post.client_id, author_id: p.id, body: body.trim(), kind: 'comment' });
  await delay(null);
}

/** Envia uma mídia do post para o bucket post-media e devolve o caminho. */
export async function uploadPostMedia(clientId: string, file: File): Promise<string> {
  const p = requireStaff();
  const client = assertClientAccess(p, clientId);
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new AppError('A mídia do post precisa ser imagem ou vídeo.');
  }
  return uploadToStorage('post-media', client.agency_id, client.id, file);
}
