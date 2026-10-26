// Relatórios mensais. Cliente só enxerga os publicados.

import type { Report } from '../../types/database';
import { AppError, assertClientAccess, canSeeRow, isStaff, requireProfile, requireStaff } from '../mock/access';
import { db, delay, nowIso, uid } from '../mock/db';
import { getSignedUrl, uploadToStorage } from '../storage';

export type ReportInput = Pick<
  Report,
  'client_id' | 'month' | 'reach' | 'new_followers' | 'contacts' | 'appointments' | 'ad_spend' | 'cost_per_lead' | 'notes'
>;

function visible(r: Report): boolean {
  const p = requireProfile();
  if (!canSeeRow(p, r)) return false;
  return isStaff(p) || r.published;
}

/** Mais recente primeiro. */
export async function listReports(clientId: string): Promise<Report[]> {
  const rows = db.reports
    .filter((r) => r.client_id === clientId)
    .filter(visible)
    .sort((a, b) => b.month.localeCompare(a.month));
  return delay(rows.map((r) => ({ ...r })));
}

/**
 * Cria (reportId nulo) ou atualiza o relatório do mês.
 * Único por cliente + mês: criar um mês que já existe dá erro em vez de sobrescrever.
 */
export async function saveReport(
  input: ReportInput,
  publish: boolean,
  pdf: File | null | undefined,
  reportId: string | null,
): Promise<Report> {
  const p = requireStaff();
  const client = assertClientAccess(p, input.client_id);
  if (!/^\d{4}-\d{2}-01$/.test(input.month)) throw new AppError('Escolha o mês do relatório.');

  const sameMonth = db.reports.find((r) => r.client_id === client.id && r.month === input.month);
  let report = reportId ? db.reports.find((r) => r.id === reportId && r.client_id === client.id) : undefined;
  if (reportId && !report) throw new AppError('Relatório não encontrado.');
  if (sameMonth && sameMonth !== report) {
    throw new AppError('Este mês já tem relatório. Volte e use Editar nele.');
  }
  // Valida e envia o PDF antes de gravar, para um erro não deixar o relatório salvo pela metade.
  let pdfPath: string | null = null;
  if (pdf) {
    if (pdf.type !== 'application/pdf') throw new AppError('O relatório precisa ser um arquivo PDF.');
    pdfPath = await uploadToStorage('report-pdfs', client.agency_id, client.id, pdf);
  }
  const ts = nowIso();
  if (!report) {
    report = {
      id: uid(),
      created_at: ts,
      updated_at: ts,
      agency_id: client.agency_id,
      client_id: client.id,
      month: input.month,
      reach: null,
      new_followers: null,
      contacts: null,
      appointments: null,
      ad_spend: null,
      cost_per_lead: null,
      notes: null,
      pdf_path: null,
      published: false,
    };
    db.reports.push(report);
  }
  Object.assign(report, input, { updated_at: ts });
  if (pdf) report.pdf_path = pdfPath;
  if (publish) report.published = true;
  return delay({ ...report });
}

export async function unpublishReport(id: string): Promise<void> {
  requireStaff();
  const r = db.reports.find((x) => x.id === id);
  if (!r || !visible(r)) throw new AppError('Relatório não encontrado.');
  r.published = false;
  r.updated_at = nowIso();
  await delay(null);
}

export async function getReportPdfUrl(report: Report): Promise<string | null> {
  if (!report.pdf_path) return null;
  return getSignedUrl('report-pdfs', report.pdf_path);
}
