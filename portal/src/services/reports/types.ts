import type { Report } from '../../types/database';

export type ReportInput = Pick<
  Report,
  'client_id' | 'month' | 'reach' | 'new_followers' | 'contacts' | 'appointments' | 'ad_spend' | 'cost_per_lead' | 'notes'
>;
