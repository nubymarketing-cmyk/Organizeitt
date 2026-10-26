// Login: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

const impl = USE_SUPABASE ? sb : mock;

/** Modo demonstração: mostra os atalhos de login e os dados de exemplo. */
export const IS_DEMO = !USE_SUPABASE;

export const getSessionProfile = impl.getSessionProfile;
export const sendMagicLink = impl.sendMagicLink;
export const signOut = impl.signOut;
export const onAuthChange = USE_SUPABASE ? sb.onAuthChange : () => () => {};

// Só no modo demonstração.
export const { openMagicLinkDemo, listDemoUsers, resetDemo } = mock;
