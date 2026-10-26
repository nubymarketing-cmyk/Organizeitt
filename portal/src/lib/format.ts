import type { AgencyPlan, AgencyStatus, CommentKind, FileFolder, Network, PostFormat, PostStatus, UserRole } from '../types/database';

const tz = undefined; // usa o fuso do navegador

export function formatDate(iso: string | null): string {
  if (!iso) return 'sem data';
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: tz });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return 'sem data';
  return new Date(iso).toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "2026-07-01" -> "Julho de 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return monthTitle(new Date(y, m - 1, 1));
}

export function monthTitle(date: Date): string {
  const s = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('pt-BR');
}

export function formatCurrency(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function formatBytes(n: number | null): string {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter((w) => w && !/^(dra?|sr|sra)\.?$/i.test(w))
    .filter((w) => w.length > 2 || /^[A-ZÀ-Ú]/.test(w))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export const STATUS_LABEL: Record<PostStatus, string> = {
  in_creation: 'Em criação',
  awaiting_approval: 'Aguardando aprovação',
  changes_requested: 'Ajuste pedido',
  approved: 'Aprovado',
  published: 'Publicado',
};

/** Classes de cor por status, seguindo a paleta do protótipo. */
export const STATUS_STYLE: Record<PostStatus, string> = {
  in_creation: 'text-dim bg-white/5 border-white/10',
  awaiting_approval: 'text-warn bg-warn/15 border-warn/30',
  changes_requested: 'text-bad bg-bad/15 border-bad/30',
  approved: 'text-azure bg-azure/15 border-azure/30',
  published: 'text-ok bg-ok/15 border-ok/30',
};

export const STATUS_DOT: Record<PostStatus, string> = {
  in_creation: 'bg-dim',
  awaiting_approval: 'bg-warn',
  changes_requested: 'bg-bad',
  approved: 'bg-azure',
  published: 'bg-ok',
};

export const NETWORK_LABEL: Record<Network, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  outro: 'Outro',
};

export const FORMAT_LABEL: Record<PostFormat, string> = {
  imagem: 'Imagem',
  carrossel: 'Carrossel',
  video: 'Vídeo',
  story: 'Story',
  reels: 'Reels',
};

export const FOLDER_LABEL: Record<FileFolder, string> = {
  marca: 'Marca',
  artes_finais: 'Artes finais',
  fotos_videos: 'Fotos e vídeos',
  documentos: 'Documentos',
};

export const FOLDER_HINT: Record<FileFolder, string> = {
  marca: 'logos, cores e fontes',
  artes_finais: 'artes aprovadas para usar onde quiser',
  fotos_videos: 'material bruto do consultório',
  documentos: 'contratos, briefings e afins',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  agency_admin: 'Admin da agência',
  agency_member: 'Equipe da agência',
  client_owner: 'Dono da clínica',
  client_member: 'Equipe da clínica',
};

export const PLAN_LABEL: Record<AgencyPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  agencia: 'Agência',
};

/** Limite de clientes ativos por plano (null = ilimitado). Igual a plan_client_limit no banco. */
export const PLAN_CLIENT_LIMIT: Record<AgencyPlan, number | null> = {
  starter: 5,
  pro: 20,
  agencia: null,
};

export const AGENCY_STATUS_LABEL: Record<AgencyStatus, string> = {
  trial: 'Em teste',
  active: 'Ativa',
  suspended: 'Suspensa',
  canceled: 'Cancelada',
};

export const COMMENT_KIND_LABEL: Record<CommentKind, string> = {
  comment: 'comentou',
  approval: 'aprovou',
  change_request: 'pediu ajuste',
};
