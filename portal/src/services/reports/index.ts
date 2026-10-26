// Relatórios mensais: Supabase quando configurado, senão o modo demonstração.

import { USE_SUPABASE } from '../config';
import * as mock from './mock';
import * as sb from './supabase';

export type { ReportInput } from './types';

export const { listReports, saveReport, unpublishReport, getReportPdfUrl } = USE_SUPABASE ? sb : mock;
