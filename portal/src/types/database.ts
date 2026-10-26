// Tipos escritos à mão a partir da seção 4 do escopo, iguais às tabelas de supabase/migrations/0001_portal.sql.

export type UserRole = 'agency_admin' | 'agency_member' | 'client_owner' | 'client_member';
export type PostStatus =
  | 'in_creation'
  | 'awaiting_approval'
  | 'changes_requested'
  | 'approved'
  | 'published';
export type Network = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube' | 'outro';
export type PostFormat = 'imagem' | 'carrossel' | 'video' | 'story' | 'reels';
export type CommentKind = 'comment' | 'approval' | 'change_request';
export type FileFolder = 'marca' | 'artes_finais' | 'fotos_videos' | 'documentos';
export type AgencyPlan = 'starter' | 'pro' | 'agencia';
export type AgencyStatus = 'trial' | 'active' | 'suspended' | 'canceled';

export interface Agency {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  plan: AgencyPlan;
  status: AgencyStatus;
  trial_ends_at: string | null;
  onboarding_done_at: string | null;
}

export interface Client {
  id: string;
  created_at: string;
  agency_id: string;
  name: string;
  specialty: string | null;
  contact_email: string | null;
  active: boolean;
  /** Cor do cliente no calendário geral. */
  color: string | null;
  /** Mensalidade cobrada da clínica e dia de vencimento (1 a 28). */
  monthly_fee: number | null;
  billing_day: number | null;
}

export interface Profile {
  id: string;
  created_at: string;
  agency_id: string;
  client_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  tour_done_at: string | null;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  agency_id: string;
  client_id: string;
  title: string;
  caption: string | null;
  network: Network;
  format: PostFormat;
  scheduled_at: string | null;
  status: PostStatus;
  current_version: number;
  created_by: string;
  /** Responsável da equipe pelo post. */
  assignee_id: string | null;
  status_changed_at: string;
}

export interface PostVersion {
  id: string;
  created_at: string;
  post_id: string;
  agency_id: string;
  client_id: string;
  version_number: number;
  caption: string | null;
  /** Caminhos no bucket post-media, em ordem. */
  media: string[];
  created_by: string;
}

export interface PostComment {
  id: string;
  created_at: string;
  post_id: string;
  agency_id: string;
  client_id: string;
  author_id: string;
  body: string;
  kind: CommentKind;
}

export interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  agency_id: string;
  client_id: string;
  /** Sempre o dia 1 do mês, formato YYYY-MM-DD. */
  month: string;
  reach: number | null;
  new_followers: number | null;
  contacts: number | null;
  appointments: number | null;
  ad_spend: number | null;
  cost_per_lead: number | null;
  notes: string | null;
  pdf_path: string | null;
  published: boolean;
}

export interface FileRecord {
  id: string;
  created_at: string;
  agency_id: string;
  client_id: string;
  folder: FileFolder;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string;
}

export type ActivityAction =
  | 'post_submitted'
  | 'post_version'
  | 'post_approved'
  | 'changes_requested'
  | 'post_published'
  | 'post_returned'
  | 'comment'
  | 'report_published'
  | 'file_uploaded';

export interface ActivityEntry {
  id: string;
  created_at: string;
  agency_id: string;
  client_id: string;
  post_id: string | null;
  actor_id: string | null;
  action: ActivityAction;
  subject: string | null;
}

export interface ClientCharge {
  id: string;
  created_at: string;
  agency_id: string;
  client_id: string;
  /** YYYY-MM-DD */
  due_date: string;
  amount: number;
  paid_at: string | null;
  notes: string | null;
}

export type StorageBucket = 'post-media' | 'client-files' | 'report-pdfs' | 'agency-assets';
