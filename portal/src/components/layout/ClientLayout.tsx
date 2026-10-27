import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMarkTourDone, useSession, useSignOut } from '../../hooks/useAuth';
import { useMyAgency } from '../../hooks/useAgency';
import { useClient } from '../../hooks/useClients';
import { brandStyle } from '../../lib/brand';
import { PageFallback, cx } from '../ui';
import { AgencyBrand } from './AgencyBrand';
import { ClientTour } from '../client/ClientTour';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../ThemeToggle';
import { Icon, type IconName } from '../icons';

// No máximo 4 itens, com nomes que a clínica entende.
const TABS: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/app', label: 'Início', icon: 'home', end: true },
  { to: '/app/posts', label: 'Meus posts', icon: 'calendar' },
  { to: '/app/resultados', label: 'Resultados', icon: 'chart' },
  { to: '/app/arquivos', label: 'Arquivos', icon: 'folder' },
];

export function ClientLayout() {
  const { data: profile } = useSession();
  const client = useClient(profile?.client_id);
  const agency = useMyAgency();
  const signOut = useSignOut();
  const markTour = useMarkTourDone();
  const navigate = useNavigate();
  // Primeiro acesso abre o tour sozinho; depois ele volta pelo botão Ajuda.
  const [tourOpen, setTourOpen] = useState(false);
  const showTour = tourOpen || (!!profile && !profile.tour_done_at && !markTour.isPending && !markTour.isSuccess);
  const closeTour = () => {
    setTourOpen(false);
    navigate('/app');
    if (profile && !profile.tour_done_at) markTour.mutate();
  };

  return (
    <div className="brand-scope relative min-h-screen overflow-x-hidden bg-night" style={brandStyle(agency.data?.primary_color)}>

      <div className="relative mx-auto max-w-md px-4 pb-28 pt-5">
        <header className="mb-6 flex items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <AgencyBrand agency={agency.data} />
            <p className="truncate text-xs text-muted">{client.data?.name ?? ' '}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-fg/5 hover:text-fg"
              onClick={() => setTourOpen(true)}
              aria-label="Ajuda: como usar o portal"
              title="Ajuda"
            >
              <Icon name="help" />
            </button>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-fg/5 hover:text-fg"
              onClick={() => signOut.mutate()}
              aria-label="Sair"
              title="Sair"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-md justify-between gap-1 px-3 py-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cx(
                  'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center text-[11px] font-semibold transition',
                  isActive ? 'bg-brand/10 text-link' : 'text-muted hover:text-fg',
                )
              }
            >
              <Icon name={t.icon} />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {showTour ? <ClientTour onStep={(tab) => navigate(tab)} onClose={closeTour} /> : null}
    </div>
  );
}
