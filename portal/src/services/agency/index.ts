// Agência: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export type { BrandingInput, PlatformAgency, TeamMember } from './types';

export const {
  getAgency,
  updateBranding,
  listTeam,
  setMemberClients,
  isPlatformAdmin,
  listPlatformAgencies,
  platformUpdateAgency,
} = USE_SUPABASE ? sb : mock;
