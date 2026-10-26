import { useState } from 'react';
import { useSession } from '../../hooks/useAuth';
import { useReports } from '../../hooks/useReports';
import { monthLabel } from '../../lib/format';
import { getReportPdfUrl } from '../../services/reports';
import type { Report } from '../../types/database';
import { Button, Card, EmptyState, ErrorState, InlineError, PageHeader, SkeletonList, cx } from '../../components/ui';
import { ReportIndicators, findPreviousMonth } from '../../components/ReportIndicators';

export function RelatoriosPage() {
  const { data: profile } = useSession();
  const reports = useReports(profile?.client_id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Um por mês, comparado sempre com o mês anterior." />
      {reports.isLoading ? (
        <SkeletonList rows={3} />
      ) : reports.isError ? (
        <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
      ) : !reports.data?.length ? (
        <EmptyState title="Nenhum relatório ainda" text="O relatório do mês aparece aqui assim que a equipe publicar." />
      ) : (
        <ReportBrowser
          reports={reports.data}
          selected={reports.data.find((r) => r.id === selectedId) ?? reports.data[0]}
          onSelect={setSelectedId}
        />
      )}
    </div>
  );
}

function ReportBrowser({ reports, selected, onSelect }: { reports: Report[]; selected: Report; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={cx(
              'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold',
              r.id === selected.id ? 'border-transparent bg-brand text-white' : 'border-line text-muted',
            )}
          >
            {monthLabel(r.month)}
          </button>
        ))}
      </div>
      <h2 className="font-display text-lg font-bold text-white">{monthLabel(selected.month)}</h2>
      <ReportIndicators report={selected} previous={findPreviousMonth(reports, selected)} />
      {selected.notes ? (
        <Card>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Comentário da equipe</p>
          <p className="whitespace-pre-line text-sm text-white">{selected.notes}</p>
        </Card>
      ) : null}
      <PdfButton report={selected} />
    </div>
  );
}

export function PdfButton({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!report.pdf_path) return <p className="text-sm text-dim">Este mês não tem PDF anexado.</p>;
  const open = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await getReportPdfUrl(report);
      if (!url) throw new Error('O PDF de demonstração não tem arquivo real. Com o Supabase ligado, o download abre aqui.');
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-2">
      <Button variant="secondary" className="w-full" loading={loading} onClick={open}>
        Baixar PDF do relatório
      </Button>
      <InlineError error={error} />
    </div>
  );
}
