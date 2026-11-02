import { useState } from 'react';
import { getReportPdfUrl } from '../../services/reports';
import type { Report } from '../../types/database';
import { Button, InlineError } from '../ui';

/** PDF do relatório, como opção secundária. */
export function PdfButton({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!report.pdf_path) return null;
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
      <Button variant="ghost" className="w-full" loading={loading} onClick={open}>
        Ver relatório completo em PDF
      </Button>
      <InlineError error={error} />
    </div>
  );
}
