// Avisos no modo demonstração (congelado): sem avisos.

import type { AppNotification } from '../../types/database';
import { AppError } from '../errors';
import { delay } from '../mock/db';

export async function listNotifications(): Promise<AppNotification[]> {
  return delay([]);
}

export async function markNotificationsRead(): Promise<void> {
  await delay(null);
}

export async function updateMyPhone(): Promise<void> {
  throw new AppError('Disponível só com o Supabase ligado.');
}
