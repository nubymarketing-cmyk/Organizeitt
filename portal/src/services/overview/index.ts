// Visão geral da agência: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export type { ActivityWithNames, AttentionItem, AttentionKind, Overview } from './types';

export const { getOverview, listActivity } = USE_SUPABASE ? sb : mock;
