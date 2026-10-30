import type { Client, Profile, UserRole } from '../../types/database';

/** none: sem cobrança; open: a vencer; paid: tudo pago; overdue: vencida. */
export type PaymentStatus = 'none' | 'open' | 'paid' | 'overdue';

export interface ClientWithCounts extends Client {
  awaiting_count: number;
  changes_count: number;
  users_count: number;
  /** Posts do mês: publicados e planejados (com data no mês). */
  month_published: number;
  month_planned: number;
  /** Data passou e não foi publicado. */
  overdue_count: number;
  payment_status: PaymentStatus;
}

export interface ClientInput {
  name: string;
  specialty: string;
  contact_email: string;
  color: string | null;
  monthly_fee: number | null;
  billing_day: number | null;
}

/** Pessoa da clínica: com conta ou com convite pendente (e o código de acesso, que só o admin vê). */
export interface ClientUser extends Profile {
  pending: boolean;
  access_code: string | null;
}

export interface InviteInput {
  email: string;
  full_name: string;
  role: UserRole;
  client_id: string | null;
  /** Clientes atribuídos, só para equipe da agência. */
  assigned_client_ids?: string[];
}
