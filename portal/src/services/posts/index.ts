// Posts, versões e comentários: Supabase quando configurado, senão o modo demonstração.
// As mudanças de status espelham as RPCs da seção 5 nos dois modos.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export type { AgencyPostFilters, CommentWithAuthor, PostDetail, PostFilters, PostInput, PostWithClient } from './types';

const impl = USE_SUPABASE ? sb : mock;

export const {
  listPosts,
  listAgencyPosts,
  reschedulePost,
  getPost,
  createPost,
  updatePost,
  submitPostForApproval,
  approvePost,
  requestPostChanges,
  createPostVersion,
  markPostPublished,
  returnPostToCreation,
  setPostStatus,
  setPostAssignee,
  deletePost,
  addComment,
  uploadPostMedia,
} = impl;
