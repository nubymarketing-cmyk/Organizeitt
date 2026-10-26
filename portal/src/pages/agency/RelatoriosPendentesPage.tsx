import { Link } from 'react-router-dom';
import { useOverview } from '../../hooks/useOverview';
import { monthLabel } from '../../lib/format';
import { Card, EmptyState, ErrorState, PageHeader, SkeletonList } from '../../components/ui';
import { ClientAvatar } from '../../components/AgencyParts';

/** Clientes sem o relatório do mês anterior publicado. */
export function RelatoriosPendentesPage() {
  const overview = useOverview();
  const month = overview.data ? monthLabel(overview.data.report_month) : '';

  return (
    <div>
      <Link to="/agencia" className="text-sm text-lilac">‹ Visão geral</Link>
      <PageHeader title="Relatórios não lançados" subtitle={month ? `Clientes sem o relatório de ${month} publicado.` : undefined} />
      {overview.isLoading ? (
        <SkeletonList rows={3} />
      ) : overview.isError || !overview.data ? (
        <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
      ) : !overview.data.missing_reports.length ? (
        <EmptyState title="Todos os relatórios lançados" text={`Todos os clientes já têm o relatório de ${month} publicado.`} />
      ) : (
        <div className="space-y-2">
          {overview.data.missing_reports.map((c) => (
            <Link key={c.client_id} to={`/agencia/clientes/${c.client_id}?aba=relatorios`} className="block">
              <Card className="flex items-center gap-3 py-3 hover:border-violet/40">
                <ClientAvatar name={c.client_name} color={c.client_color} />
                <p className="flex-1 truncate font-semibold text-white">{c.client_name}</p>
                <span className="text-xs text-lilac">lançar ›</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
