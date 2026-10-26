import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  approvePost,
  createPost,
  createPostVersion,
  getPost,
  listPosts,
  markPostPublished,
  requestPostChanges,
  returnPostToCreation,
  submitPostForApproval,
  updatePost,
  uploadPostMedia,
  type PostFilters,
  type PostInput,
} from '../services/posts';

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
  };
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
