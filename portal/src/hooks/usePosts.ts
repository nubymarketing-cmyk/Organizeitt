import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  approvePost,
  createPost,
  createPostVersion,
  getPost,
  listPosts,
  listAgencyPosts,
  reschedulePost,
  markPostPublished,
  requestPostChanges,
  returnPostToCreation,
  setPostStatus,
  setPostAssignee,
  deletePost,
  submitPostForApproval,
  updatePost,
  uploadPostMedia,
  type AgencyPostFilters,
  type PostFilters,
  type PostInput,
} from '../services/posts';
import type { PostStatus } from '../types/database';

export function usePosts(filters: PostFilters = {}) {
  return useQuery({ queryKey: ['posts', filters], queryFn: () => listPosts(filters) });
}

export function usePost(id: string | undefined) {
  return useQuery({ queryKey: ['post', id], queryFn: () => getPost(id!), enabled: !!id });
}

/** Toda mudança em post invalida listas, detalhe e contagens de clientes. */
function useInvalidatePosts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['posts'] });
    qc.invalidateQueries({ queryKey: ['post'] });
    qc.invalidateQueries({ queryKey: ['clients'] });
    qc.invalidateQueries({ queryKey: ['agency-posts'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
    qc.invalidateQueries({ queryKey: ['activity'] });
  };
}

/** Posts de todos os clientes (visão geral, lista geral e calendário geral). */
export function useAgencyPosts(filters: AgencyPostFilters = {}, enabled = true) {
  return useQuery({ queryKey: ['agency-posts', filters], queryFn: () => listAgencyPosts(filters), enabled });
}

/** Muda a data já na tela e desfaz se o banco recusar. */
export function useReschedulePost() {
  const qc = useQueryClient();
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) => reschedulePost(id, scheduledAt),
    onMutate: async ({ id, scheduledAt }) => {
      await qc.cancelQueries({ queryKey: ['agency-posts'] });
      const previous = qc.getQueriesData<Array<{ id: string; scheduled_at: string | null }>>({ queryKey: ['agency-posts'] });
      for (const [key, data] of previous) {
        if (data) qc.setQueryData(key, data.map((p) => (p.id === id ? { ...p, scheduled_at: scheduledAt } : p)));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      for (const [key, data] of ctx?.previous ?? []) qc.setQueryData(key, data);
    },
    onSettled: invalidate,
  });
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: (input: PostInput) => createPost(input), onSuccess: invalidate });
}

export function useUpdatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Omit<PostInput, 'client_id'> }) => updatePost(id, input),
    onSuccess: invalidate,
  });
}

export function useSubmitPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: submitPostForApproval, onSuccess: invalidate });
}

export function useApprovePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: approvePost, onSuccess: invalidate });
}

export function useRequestChanges() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => requestPostChanges(id, comment),
    onSuccess: invalidate,
  });
}

export function useCreateVersion() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, caption, media }: { id: string; caption: string; media: string[] }) =>
      createPostVersion(id, caption, media),
    onSuccess: invalidate,
  });
}

export function useMarkPublished() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: markPostPublished, onSuccess: invalidate });
}

export function useReturnToCreation() {
  const invalidate = useInvalidatePosts();
  return useMutation({ mutationFn: returnPostToCreation, onSuccess: invalidate });
}

export function useSetPostStatus() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PostStatus }) => setPostStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useSetPostAssignee() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string | null }) => setPostAssignee(id, assigneeId),
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['post', id] });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useAddComment() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) => addComment(postId, body),
    onSuccess: invalidate,
  });
}

export function useUploadPostMedia() {
  return useMutation({
    mutationFn: ({ clientId, file }: { clientId: string; file: File }) => uploadPostMedia(clientId, file),
  });
}
