import { useSession } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui';
import { FolderBrowser } from '../../components/FolderBrowser';

export function ArquivosPage() {
  const { data: profile } = useSession();
  if (!profile?.client_id) return null;
  return (
    <div>
      <PageHeader title="Arquivos" subtitle="Marca, artes e material da clínica num lugar só." />
      <FolderBrowser clientId={profile.client_id} />
    </div>
  );
}
