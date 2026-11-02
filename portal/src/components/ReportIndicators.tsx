import type { Report } from '../types/database';
import { formatCurrency, formatNumber } from '../lib/format';
import { cx } from './ui';

type Key = 'reach' | 'new_followers' | 'contacts' | 'appointments' | 'ad_spend' | 'cost_per_lead';

const INDICATORS: Array<{ key: Key; label: string; money?: boolean; lowerIsBetter?: boolean }> = [
  { key: 'contacts', label: 'contatos' },
  { key: 'appointments', label: 'agendamentos' },
  { key: 'cost_per_lead', label: 'custo por contato', money: true, lowerIsBetter: true },
  { key: 'reach', label: 'pessoas alcançadas' },
  { key: 'new_followers', label: 'novos seguidores' },
  { key: 'ad_spend', label: 'investido em anúncios', money: true },
];

/** Relatório do mês imediatamente anterior, se existir na lista. */
export function findPreviousMonth(reports: Report[], report: Report): Report | undefined {
  const [y, m] = report.month.split('-').map(Number);
  const prev = new Date(y, m - 2, 1);
  const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
  return reports.find((r) => r.month === key);
}

/** Os 4 primeiros vão para a tela Início; os 6 para Relatórios. */
export function ReportIndicators({ report, previous, compact }: { report: Report; previous?: Report; compact?: boolean }) {
  const list = compact ? INDICATORS.slice(0, 4) : INDICATORS;
  return (
    <div className="grid grid-cols-2 gap-3">
      {list.map((ind) => {
        const value = report[ind.key];
        const before = previous?.[ind.key] ?? null;
        const variation = value !== null && before ? ((value - before) / before) * 100 : null;
        const good = variation === null ? null : ind.lowerIsBetter ? variation < 0 : variation > 0;
        return (
          <div key={ind.key} className="rounded-2xl border border-line bg-card p-3.5">
            <p className="font-display text-2xl font-bold tracking-tight text-fg">
              {ind.money ? formatCurrency(value) : formatNumber(value)}
            </p>
            <p className="text-xs text-muted">{ind.label}</p>
            {variation !== null && Math.abs(variation) >= 0.5 ? (
              <p className={cx('mt-1 text-xs font-bold', good ? 'text-ok' : 'text-bad')}>
                {variation > 0 ? '↑' : '↓'} {Math.abs(variation).toFixed(0)}% vs. mês anterior
              </p>
            ) : previous ? (
              <p className="mt-1 text-xs text-dim">igual ao mês anterior</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
