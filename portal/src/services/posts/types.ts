import type { Network, Post, PostComment, PostFormat, PostStatus, PostVersion } from '../../types/database';

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
