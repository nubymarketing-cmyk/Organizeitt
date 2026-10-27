import { useState } from 'react';
import { useSession } from '../../hooks/useAuth';
import { useReports } from '../../hooks/useReports';
import { formatNumber, monthLabel } from '../../lib/format';
import type { Report } from '../../types/database';
import { Card, EmptyState, ErrorState, PageHeader, SkeletonList, cx } from '../../components/ui';
import { findPreviousMonth } from '../../components/ReportIndicators';
import { PdfButton } from '../../components/client/PdfButton';

/** Os três números que a clínica entende, sem jargão. */
const NUMBERS: Array<{ key: 'reach' | 'new_followers' | 'contacts'; label: string }> = [
  { key: 'reach', label: 'Quantas pessoas viram' },
  { key: 'new_followers', label: 'Novos seguidores' },
  { key: 'contacts', label: 'Pacientes que chamaram' },
];

export function ResultadosPage() {
  const { data: profile } = useSession();
  const reports = useReports(profile?.client_id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Resultados" subtitle="Como foi o mês, comparado com o mês anterior." />
      {reports.isLoading ? (
        <SkeletonList rows={3} />
      ) : reports.isError ? (
        <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
      ) : !reports.data?.length ? (
        <EmptyState title="Ainda sem resultados" text="Os números do mês aparecem aqui assim que a equipe fechar o primeiro mês." />
      ) : (
        <MonthResults
          reports={reports.data}
          selected={reports.data.find((r) => r.id === selectedId) ?? reports.data[0]}
          onSelect={setSelectedId}
        />
      )}
    </div>
  );
}

function MonthResults({ reports, selected, onSelect }: { reports: Report[]; selected: Report; onSelect: (id: string) => void }) {
  const previous = findPreviousMonth(reports, selected);
  return (
    <div className="space-y-5">
      {reports.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={cx(
                'min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm font-bold',
                r.id === selected.id ? 'border-transparent bg-brand text-brand-fg' : 'border-line text-muted',
              )}
            >
              {monthLabel(r.month)}
            </button>
          ))}
        </div>
      ) : null}

      <h2 className="font-display text-lg font-bold text-fg">{monthLabel(selected.month)}</h2>

      <div className="space-y-3">
        {NUMBERS.map((n) => (
          <BigNumber key={n.key} label={n.label} value={selected[n.key]} before={previous?.[n.key] ?? null} />
        ))}
      </div>

      {selected.notes ? (
        <Card className="border-violet/40 bg-violet/10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-lilac">O que a equipe diz</p>
          <p className="whitespace-pre-line text-base leading-relaxed text-fg">{selected.notes}</p>
        </Card>
      ) : null}

      <div className="pt-2">
        <PdfButton report={selected} />
      </div>
    </div>
  );
}

function BigNumber({ label, value, before }: { label: string; value: number | null; before: number | null }) {
  const diff = value !== null && before !== null && before !== 0 ? Math.round(((value - before) / before) * 100) : null;
  const up = diff !== null && diff > 0;
  const down = diff !== null && diff < 0;
  return (
    <Card className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="font-display text-4xl font-extrabold text-fg">{formatNumber(value)}</p>
      </div>
      {diff !== null ? (
        <div className={cx('text-right', up ? 'text-ok' : down ? 'text-bad' : 'text-muted')}>
          <p className="font-display text-2xl font-bold tracking-tight">
            {up ? '↑' : down ? '↓' : '='} {Math.abs(diff)}%
          </p>
          <p className="text-xs">{up ? 'a mais que' : down ? 'a menos que' : 'igual ao'} mês anterior</p>
        </div>
      ) : (
        <p className="max-w-[110px] text-right text-xs text-dim">sem mês anterior para comparar</p>
      )}
    </Card>
  );
}
