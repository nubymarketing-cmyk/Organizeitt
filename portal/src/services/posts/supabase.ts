// Posts no Supabase. Leitura direto das tabelas (o RLS filtra), mudanças pelas RPCs.

import type { Post, PostComment, PostStatus, PostVersion, UserRole } from '../../types/database';
import { isStaffRole } from '../../lib/roles';
import { AppError } from '../errors';
import { parseDemoMedia, uploadToStorage } from '../storage';
import { clientAgencyId, supabase, unwrap } from '../supabase';
import type { CommentWithAuthor, PostDetail, PostFilters, PostInput } from './types';

export async function listPosts(filters: PostFilters = {}): Promise<Post[]> {
  let q = supabase().from('posts').select('*').order('scheduled_at', { ascending: true, nullsFirst: true });
  if (filters.clientId) q = q.eq('client_id', filters.clientId);
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.network && filters.network !== 'all') q = q.eq('network', filters.network);
  return unwrap(await q) as Post[];
}

type CommentRow = PostComment & { author: { full_name: string; role: UserRole } | null };

export async function getPost(id: string): Promise<PostDetail> {
  const db = supabase();
  const [post, versions, comments] = await Promise.all([
    db.from('posts').select('*').eq('id', id).maybeSingle(),
    db.from('post_versions').select('*').eq('post_id', id).order('version_number', { ascending: false }),
    db
      .from('post_comments')
      .select('*, author:profiles(full_name, role)')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
  ]);
  const row = unwrap(post) as Post | null;
  if (!row) throw new AppError('Post não encontrado.');
  return {
    post: row,
    versions: unwrap(versions) as PostVersion[],
    comments: (unwrap(comments) as CommentRow[]).map(({ author, ...c }): CommentWithAuthor => ({
      ...c,
      author_name: author?.full_name ?? 'Usuário',
      author_is_staff: author ? isStaffRole(author.role) : false,
    })),
  };
}

function rpcPost(fn: string, args: Record<string, unknown>) {
  return supabase().rpc(fn, args).single<Post>();
}

export async function createPost(input: PostInput): Promise<Post> {
  return unwrap(
    await rpcPost('create_post', {
      p_client: input.client_id,
      p_title: input.title,
      p_caption: input.caption,
      p_network: input.network,
      p_format: input.format,
      p_scheduled_at: input.scheduled_at,
      p_media: input.media,
    }),
  );
}

/** Edita dados do post. Legenda e mídia só mudam direto enquanto está em criação. */
export async function updatePost(id: string, input: Omit<PostInput, 'client_id'>): Promise<Post> {
  return unwrap(
    await rpcPost('update_post', {
      p_post: id,
      p_title: input.title,
      p_caption: input.caption,
      p_network: input.network,
      p_format: input.format,
      p_scheduled_at: input.scheduled_at,
      p_media: input.media,
    }),
  );
}

export async function submitPostForApproval(id: string): Promise<Post> {
  return unwrap(await rpcPost('submit_post_for_approval', { p_post: id }));
}

export async function approvePost(id: string): Promise<Post> {
  return unwrap(await rpcPost('approve_post', { p_post: id }));
}

export async function requestPostChanges(id: string, comment: string): Promise<Post> {
  return unwrap(await rpcPost('request_post_changes', { p_post: id, p_comment: comment }));
}

export async function createPostVersion(id: string, caption: string, media: string[]): Promise<Post> {
  return unwrap(await rpcPost('create_post_version', { p_post: id, p_caption: caption, p_media: media }));
}

export async function markPostPublished(id: string): Promise<Post> {
  return unwrap(await rpcPost('mark_post_published', { p_post: id }));
}

/** Qualquer status -> em criação (retrabalho). Só agência. */
export async function returnPostToCreation(id: string): Promise<Post> {
  return unwrap(await rpcPost('return_post_to_creation', { p_post: id }));
}

/** Agência escolhe qualquer status direto no editor. */
export async function setPostStatus(id: string, status: PostStatus): Promise<Post> {
  return unwrap(await rpcPost('set_post_status', { p_post: id, p_status: status }));
}

/** Responsável da equipe pelo post (null = ninguém). */
export async function setPostAssignee(id: string, assigneeId: string | null): Promise<Post> {
  return unwrap(await rpcPost('set_post_assignee', { p_post: id, p_assignee: assigneeId }));
}

/** Exclui o post e tenta apagar as mídias dele do Storage. */
export async function deletePost(id: string): Promise<void> {
  const paths = unwrap(await supabase().rpc('delete_post', { p_post: id })) as string[];
  const stored = paths.filter((m) => !parseDemoMedia(m));
  // Mídia que sobrar no bucket não aparece para ninguém; não vale travar a exclusão por ela.
  if (stored.length) await supabase().storage.from('post-media').remove(stored);
}

export async function addComment(postId: string, body: string): Promise<void> {
  unwrap(await supabase().rpc('add_post_comment', { p_post: postId, p_body: body }));
}

/** Envia uma mídia do post para o bucket post-media e devolve o caminho. */
export async function uploadPostMedia(clientId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new AppError('A mídia do post precisa ser imagem ou vídeo.');
  }
  const agencyId = await clientAgencyId(clientId);
  return uploadToStorage('post-media', agencyId, clientId, file);
}
