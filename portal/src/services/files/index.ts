// Arquivos da marca: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export const { listFiles, uploadFiles, getFileUrl } = USE_SUPABASE ? sb : mock;
