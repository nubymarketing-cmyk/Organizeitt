// Relatórios no Supabase. O RLS esconde do cliente os não publicados.

import type { Report } from '../../types/database';
import { AppError } from '../errors';
import { getSignedUrl, uploadToStorage } from '../storage';
import { clientAgencyId, supabase, unwrap } from '../supabase';
import type { ReportInput } from './types';

/** O Postgres devolve numeric como texto; a interface espera número. */
function fromRow(r: Report): Report {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return { ...r, ad_spend: num(r.ad_spend), cost_per_lead: num(r.cost_per_lead) };
}

/** Mais recente primeiro. */
export async function listReports(clientId: string): Promise<Report[]> {
  const rows = unwrap(
    await supabase().from('reports').select('*').eq('client_id', clientId).order('month', { ascending: false }),
  ) as Report[];
  return rows.map(fromRow);
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
  if (!/^\d{4}-\d{2}-01$/.test(input.month)) throw new AppError('Escolha o mês do relatório.');
  let pdfPath: string | null = null;
  if (pdf) {
    if (pdf.type !== 'application/pdf') throw new AppError('O relatório precisa ser um arquivo PDF.');
    pdfPath = await uploadToStorage('report-pdfs', await clientAgencyId(input.client_id), input.client_id, pdf);
  }
  const row = unwrap(
    await supabase()
      .rpc('save_report', {
        p_report: reportId,
        p_client: input.client_id,
        p_month: input.month,
        p_reach: input.reach,
        p_new_followers: input.new_followers,
        p_contacts: input.contacts,
        p_appointments: input.appointments,
        p_ad_spend: input.ad_spend,
        p_cost_per_lead: input.cost_per_lead,
        p_notes: input.notes,
        p_pdf_path: pdfPath,
        p_publish: publish,
      })
      .single<Report>(),
  );
  return fromRow(row);
}

export async function unpublishReport(id: string): Promise<void> {
  unwrap(await supabase().rpc('unpublish_report', { p_report: id }));
}

export async function getReportPdfUrl(report: Report): Promise<string | null> {
  if (!report.pdf_path) return null;
  return getSignedUrl('report-pdfs', report.pdf_path);
}
