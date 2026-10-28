import { Link } from 'react-router-dom';
import type { ActivityWithNames } from '../services/overview';
import type { PostWithClient } from '../services/posts';
import { FORMAT_LABEL, NETWORK_LABEL, formatDateTime, initials } from '../lib/format';
import { isStaffRole } from '../lib/roles';
import { Card, StatusBadge, cx } from './ui';

const FALLBACK_COLOR = '#8B5CF6';

/** Bolinha com as iniciais do cliente na cor dele. */
export function ClientAvatar({ name, color, size = 'md' }: { name: string; color: string | null; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-sm',
      )}
      style={{ background: color ?? FALLBACK_COLOR }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/** Linha de post nas listas com todos os clientes. */
export function AgencyPostRow({ post, assigneeName }: { post: PostWithClient; assigneeName?: string }) {
  return (
    <Link to={`/agencia/posts/${post.id}`} className="block">
      <Card className="flex items-center gap-3 py-3 hover:border-violet/40">
        <ClientAvatar name={post.client_name} color={post.client_color} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{post.title}</p>
          <p className="truncate text-xs text-muted">
            {post.client_name} · {formatDateTime(post.scheduled_at)} · {NETWORK_LABEL[post.network]} · {FORMAT_LABEL[post.format]}
          </p>
          <p className="truncate text-xs text-dim">{assigneeName ? `Responsável: ${assigneeName}` : 'Sem responsável'}</p>
        </div>
        <StatusBadge status={post.status} />
      </Card>
    </Link>
  );
}

/** Frase do histórico: "Odonto Ana aprovou o post Clareamento". */
export function activityText(a: ActivityWithNames): string {
  const fromClient = a.actor_role ? !isStaffRole(a.actor_role) : false;
  const who = fromClient ? a.client_name : a.actor_name;
  const post = a.subject ? `"${a.subject}"` : 'o post';
  const where = fromClient ? '' : ` (${a.client_name})`;
  switch (a.action) {
    case 'post_submitted':
      return `${who} enviou ${post} para aprovação${where}`;
    case 'post_version':
      return `${who} enviou nova versão de ${post}${where}`;
    case 'post_approved':
      return `${who} aprovou o post ${post}${where}`;
    case 'changes_requested':
      return `${who} pediu ajuste no post ${post}${where}`;
    case 'post_published':
      return `${who} marcou ${post} como publicado${where}`;
    case 'post_returned':
      return `${who} voltou ${post} para criação${where}`;
    case 'comment':
      return `${who} comentou em ${post}${where}`;
    case 'report_published':
      return `${who} publicou o relatório${where}`;
    case 'file_uploaded':
      return `${who} enviou o arquivo ${a.subject ?? ''}${where}`;
  }
}
