// Clientes e convites: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export type { ClientWithCounts, InviteInput } from './types';

export const { listClients, getClient, createClient, deactivateClient, listClientUsers, inviteUser } = USE_SUPABASE
  ? sb
  : mock;
