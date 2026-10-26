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

/** Post com o nome e a cor do cliente, para as listas da agência com todos os clientes. */
export interface PostWithClient extends Post {
  client_name: string;
  client_color: string | null;
}

export interface AgencyPostFilters {
  /** Intervalo de data agendada, em ISO. */
  from?: string;
  to?: string;
  clientId?: string;
  status?: PostStatus | 'all';
  network?: Network | 'all';
  /** Id do responsável, ou "none" para posts sem responsável. */
  assigneeId?: string;
  /** Só posts com data passada e não publicados. */
  overdue?: boolean;
}
