import type { ActivityEntry, UserRole } from '../../types/database';

export type AttentionKind = 'no_posts_week' | 'awaiting_48h' | 'changes_24h' | 'charge_overdue';

export interface AttentionItem {
  kind: AttentionKind;
  client_id: string;
  client_name: string;
  post_id: string | null;
  post_title: string | null;
  since: string | null;
}

export interface Overview {
  awaiting: number;
  changes: number;
  overdue: number;
  reports_missing: number;
  /** Mês de referência dos relatórios (o anterior), YYYY-MM-DD. */
  report_month: string;
  missing_reports: Array<{ client_id: string; client_name: string; client_color: string | null }>;
  attention: AttentionItem[];
}

export interface ActivityWithNames extends ActivityEntry {
  actor_name: string;
  actor_role: UserRole | null;
  client_name: string;
}
