import { Suspense, useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useIsPlatformAdmin, useMyAgency } from '../../hooks/useAgency';
import { useSession, useSignOut } from '../../hooks/useAuth';
import { ROLE_LABEL, initials } from '../../lib/format';
import type { Agency } from '../../types/database';
import { PageFallback, cx } from '../ui';
import { Icon, type IconName } from '../icons';
import { Logo } from './Logo';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../ThemeToggle';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

/**
 * Computador: barra lateral completa. Tablet: só ícones. Celular: barra no topo e menu em gaveta.
 * Agenda é a única visão de todos os clientes; o que é de um cliente fica dentro de Clientes.
 */
export function AgencyLayout() {
  const { data: profile } = useSession();
  const platform = useIsPlatformAdmin();
  const signOut = useSignOut();
  const isAdmin = profile?.role === 'agency_admin';
  const agency = useMyAgency();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const onboarding = location.pathname === '/agencia/boas-vindas';

  // Fecha a gaveta ao trocar de página.
  useEffect(() => setDrawer(false), [location.pathname]);

  const items: NavItem[] = [
    { to: '/agencia', label: 'Visão geral', icon: 'home', end: true },
    { to: '/agencia/clientes', label: 'Clientes', icon: 'users' },
    { to: '/agencia/agenda', label: 'Agenda', icon: 'calendar' },
    ...(isAdmin ? [{ to: '/agencia/equipe', label: 'Equipe', icon: 'team' } as NavItem] : []),
    ...(isAdmin ? [{ to: '/agencia/configuracoes', label: 'Configurações', icon: 'settings' } as NavItem] : []),
    ...(platform.data ? [{ to: '/plataforma', label: 'Plataforma', icon: 'globe' } as NavItem] : []),
  ];

  // Agência nova: o admin passa pelas boas-vindas antes de usar o portal.
  if (isAdmin && agency.data && !agency.data.onboarding_done_at && !onboarding) {
    return <Navigate to="/agencia/boas-vindas" replace />;
  }

  const nav = (compact: boolean) => (
    <nav className="flex flex-col gap-1">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          title={compact ? i.label : undefined}
          className={({ isActive }) =>
            cx(
              'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition',
              compact && 'justify-center px-0',
              isActive ? 'bg-brand/10 font-semibold text-link' : 'text-muted hover:bg-fg/5 hover:text-fg',
            )
          }
        >
          <Icon name={i.icon} />
          {compact ? <span className="sr-only">{i.label}</span> : <span>{i.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  const userBlock = (compact: boolean) => (
    <div className={cx('border-t border-line pt-3', compact && 'flex flex-col items-center')}>
      {compact ? (
        <span
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-fg/[.08] text-xs font-semibold text-fg"
          title={profile ? `${profile.full_name} · ${ROLE_LABEL[profile.role]}` : undefined}
        >
          {profile ? initials(profile.full_name) : ''}
        </span>
      ) : (
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-semibold text-fg">{profile?.full_name}</p>
          <p className="text-xs text-dim">{profile ? ROLE_LABEL[profile.role] : ''}</p>
        </div>
      )}
      <ThemeToggle withLabel={!compact} />
      <button
        onClick={() => signOut.mutate()}
        title={compact ? 'Sair' : undefined}
        className={cx(
          'inline-flex min-h-[44px] items-center gap-2 rounded-lg text-sm text-muted hover:bg-fg/5 hover:text-fg',
          compact ? 'w-11 justify-center' : 'w-full px-3',
        )}
      >
        <Icon name="logout" />
        {compact ? <span className="sr-only">Sair</span> : <span>Sair</span>}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg md:flex">
      {/* Tablet: só ícones */}
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex lg:hidden">
        <div className="mb-4 flex flex-col items-center gap-2">
          <span className="font-display text-xl font-extrabold text-link">n</span>
          <NotificationBell align="left" />
        </div>
        <div className="flex-1">{nav(true)}</div>
        {userBlock(true)}
      </aside>

      {/* Computador: completa */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="mb-6 flex items-start justify-between pl-3">
          <div className="min-w-0">
            <Logo small />
            <p className="truncate text-xs text-dim">{agency.data?.name ?? 'área da agência'}</p>
          </div>
          <NotificationBell align="left" />
        </div>
        <div className="flex-1">{nav(false)}</div>
        {userBlock(false)}
      </aside>

      {/* Celular: barra no topo */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-2 py-1 backdrop-blur md:hidden">
        <button className="flex h-11 w-11 items-center justify-center rounded-lg text-fg" onClick={() => setDrawer(true)} aria-label="Abrir menu">
          <Icon name="menu" />
        </button>
        <Logo small />
        <NotificationBell />
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface px-3 py-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between px-3">
              <div>
                <Logo small />
                <p className="text-xs text-dim">{agency.data?.name ?? 'área da agência'}</p>
              </div>
              <button className="flex h-11 w-11 items-center justify-center rounded-lg text-muted" onClick={() => setDrawer(false)} aria-label="Fechar menu">
                <Icon name="x" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav(false)}</div>
            {userBlock(false)}
          </div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-8">
          <AccountBanner agency={agency.data} isAdmin={isAdmin} />
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

/** Conta suspensa ou teste perto do fim. */
function AccountBanner({ agency, isAdmin }: { agency: Agency | undefined; isAdmin: boolean }) {
  if (!agency) return null;
  if (agency.status === 'suspended' || agency.status === 'canceled') {
    return (
      <div className="mb-6 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
        A conta da agência está {agency.status === 'suspended' ? 'suspensa' : 'cancelada'}. Novos clientes ficam bloqueados. Fale com o suporte.
      </div>
    );
  }
  if (!isAdmin || agency.status !== 'trial' || !agency.trial_ends_at) return null;
  const days = Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / 86_400_000);
  if (days > 3) return null;
  return (
    <div className="mb-6 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
      {days > 0
        ? `Seu teste do plano Pro acaba em ${days} dia${days === 1 ? '' : 's'}. Depois vale o limite do Starter (5 clientes).`
        : 'Seu teste acabou. Vale o limite do plano Starter (5 clientes) até o pagamento ser ligado.'}
    </div>
  );
}
