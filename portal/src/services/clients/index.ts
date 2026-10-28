// Clientes e convites: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export type { ClientInput, ClientWithCounts, InviteInput, PaymentStatus } from './types';

export const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deactivateClient,
  listClientUsers,
  inviteUser,
  listCharges,
  createCharge,
  setChargePaid,
  deleteCharge,
} = USE_SUPABASE ? sb : mock;
