import { useState } from 'react';
import type { Report } from '../../types/database';
import { useReports, useSaveReport, useUnpublishReport } from '../../hooks/useReports';
import { monthKey, monthLabel } from '../../lib/format';
import { Button, Card, EmptyState, ErrorState, Field, InlineError, Input, SkeletonList, Textarea } from '../../components/ui';
import { PdfButton } from '../client/RelatoriosPage';

type NumKey = 'reach' | 'new_followers' | 'contacts' | 'appointments' | 'ad_spend' | 'cost_per_lead';
const FIELDS: Array<{ key: NumKey; label: string; step?: string }> = [
  { key: 'contacts', label: 'Contatos' },
  { key: 'appointments', label: 'Agendamentos' },
  { key: 'reach', label: 'Alcance' },
  { key: 'new_followers', label: 'Novos seguidores' },
  { key: 'ad_spend', label: 'Investimento em anúncios (R$)', step: '0.01' },
  { key: 'cost_per_lead', label: 'Custo por contato (R$)', step: '0.01' },
];

export function AgencyReports({ clientId }: { clientId: string }) {
  const reports = useReports(clientId);
  const unpublish = useUnpublishReport();
  const [editing, setEditing] = useState<Report | 'new' | null>(null);

  if (editing) {
    return <ReportForm clientId={clientId} report={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing('new')}>+ Lançar mês</Button>
      {reports.isLoading ? (
        <SkeletonList rows={3} />
      ) : reports.isError ? (
        <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
      ) : !reports.data?.length ? (
        <EmptyState title="Nenhum relatório lançado" text="Lance os números do mês e publique quando estiver pronto." />
      ) : (
        <div className="space-y-2">
          {reports.data.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-white">{monthLabel(r.month)}</p>
                <p className="text-xs text-muted">
                  {r.contacts ?? '—'} contatos · {r.appointments ?? '—'} agendamentos {r.pdf_path ? '· com PDF' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={r.published ? 'rounded-full bg-ok/15 px-2.5 py-1 text-xs font-bold text-ok' : 'rounded-full bg-warn/15 px-2.5 py-1 text-xs font-bold text-warn'}>
                  {r.published ? 'publicado' : 'rascunho'}
                </span>
                <Button variant="secondary" className="py-1.5" onClick={() => setEditing(r)}>
                  Editar
                </Button>
                {r.published ? (
                  <Button variant="ghost" className="py-1.5" onClick={() => unpublish.mutate(r.id)}>
                    Despublicar
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
          <InlineError error={unpublish.error} />
        </div>
      )}
    </div>
  );
}

function toInput(n: number | null) {
  return n === null ? '' : String(n);
}
function toNumber(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function ReportForm({ clientId, report, onDone }: { clientId: string; report: Report | null; onDone: () => void }) {
  const save = useSaveReport();
  const [month, setMonth] = useState((report?.month ?? monthKey(new Date())).slice(0, 7));
  const [values, setValues] = useState<Record<NumKey, string>>(() => ({
    reach: toInput(report?.reach ?? null),
    new_followers: toInput(report?.new_followers ?? null),
    contacts: toInput(report?.contacts ?? null),
    appointments: toInput(report?.appointments ?? null),
    ad_spend: toInput(report?.ad_spend ?? null),
    cost_per_lead: toInput(report?.cost_per_lead ?? null),
  }));
  const [notes, setNotes] = useState(report?.notes ?? '');
  const [pdf, setPdf] = useState<File | null>(null);

  const spend = toNumber(values.ad_spend);
  const contacts = toNumber(values.contacts);
  const suggestedCpl = spend && contacts ? Math.round((spend / contacts) * 100) / 100 : null;

  const submit = (publish: boolean) =>
    save.mutate(
      {
        input: {
          client_id: clientId,
          month: `${month}-01`,
          reach: toNumber(values.reach),
          new_followers: toNumber(values.new_followers),
          contacts,
          appointments: toNumber(values.appointments),
          ad_spend: spend,
          cost_per_lead: toNumber(values.cost_per_lead) ?? suggestedCpl,
          notes: notes.trim() || null,
        },
        publish,
        pdf,
      },
      { onSuccess: onDone },
    );

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-white">{report ? 'Editar relatório' : 'Lançar mês'}</h2>
        <button className="text-sm text-lilac" onClick={onDone}>
          Cancelar
        </button>
      </div>
      <Field label="Mês">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} disabled={!!report} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} hint={f.key === 'cost_per_lead' && suggestedCpl && !values.cost_per_lead ? `vazio = R$ ${suggestedCpl.toFixed(2).replace('.', ',')} (investimento ÷ contatos)` : undefined}>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step={f.step ?? '1'}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <Field label="Comentário para o cliente">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="O que funcionou, o que muda no próximo mês" />
      </Field>
      <Field label="PDF do relatório (opcional, até 20 MB)">
        <Input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
      </Field>
      {report?.pdf_path && !pdf ? <PdfButton report={report} /> : null}
      <InlineError error={save.error} />
      <div className="flex flex-wrap gap-2">
        {!report?.published ? (
          <Button variant="secondary" loading={save.isPending} onClick={() => submit(false)}>
            Salvar rascunho
          </Button>
        ) : null}
        <Button loading={save.isPending} onClick={() => submit(true)}>
          {report?.published ? 'Salvar' : 'Publicar para o cliente'}
        </Button>
      </div>
    </Card>
  );
}
