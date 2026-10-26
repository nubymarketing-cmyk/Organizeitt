import type { Client, UserRole } from '../../types/database';

export interface ClientWithCounts extends Client {
  awaiting_count: number;
  changes_count: number;
  users_count: number;
}

export interface InviteInput {
  email: string;
  full_name: string;
  role: UserRole;
  client_id: string | null;
  /** Clientes atribuídos, só para equipe da agência. */
  assigned_client_ids?: string[];
}
