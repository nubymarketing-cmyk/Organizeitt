import type { AgencyPlan, AgencyStatus, UserRole } from '../../types/database';

/** Pessoa da equipe da agência, já com acesso ou com convite pendente. */
export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  pending: boolean;
  /** Clientes atribuídos (só conta para quem é da equipe; o admin vê todos). */
  client_ids: string[];
}

export interface BrandingInput {
  name: string;
  color: string | null;
  /** Logo novo para enviar; null mantém o atual. */
  logo: File | null;
  removeLogo: boolean;
}

export interface PlatformAgency {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  plan: AgencyPlan;
  status: AgencyStatus;
  trial_ends_at: string | null;
  client_limit: number | null;
  clients_count: number;
  users_count: number;
  posts_month: number;
  admin_email: string | null;
}
