// Visão geral no modo demonstração (congelado): sem números calculados.

import { monthKey } from '../../lib/format';
import { delay } from '../mock/db';
import type { ActivityWithNames, Overview } from './types';

export async function getOverview(): Promise<Overview> {
  const now = new Date();
  return delay({
    awaiting: 0,
    changes: 0,
    overdue: 0,
    reports_missing: 0,
    report_month: monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    missing_reports: [],
    attention: [],
  });
}

export async function listActivity(): Promise<ActivityWithNames[]> {
  return delay([]);
}
