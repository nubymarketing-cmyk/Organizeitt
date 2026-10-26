import { NavLink, Outlet } from 'react-router-dom';
import { useSession, useSignOut } from '../../hooks/useAuth';
import { useClient } from '../../hooks/useClients';
import { initials } from '../../lib/format';
import { cx } from '../ui';
import { Logo } from './Logo';

const TABS = [
  { to: '/app', label: 'Início', end: true },
  { to: '/app/calendario', label: 'Calendário' },
  { to: '/app/relatorios', label: 'Relatórios' },
  { to: '/app/arquivos', label: 'Arquivos' },
];

export function ClientLayout() {
  const { data: profile } = useSession();
  const client = useClient(profile?.client_id);
  const signOut = useSignOut();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-night">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet/30 blur-[70px]" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-azure/20 blur-[70px]" />

      <div className="relative mx-auto max-w-md px-4 pb-28 pt-5">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {profile ? initials(profile.full_name) : ''}
            </div>
            <div className="leading-tight">
              <p className="text-xs text-muted">{client.data?.name ?? ' '}</p>
              <p className="font-semibold text-white">{profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Logo small />
            <button className="text-xs text-muted underline-offset-2 hover:underline" onClick={() => signOut.mutate()}>
              Sair
            </button>
          </div>
        </header>
        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-md justify-between gap-1 px-3 py-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cx('flex-1 rounded-xl px-2 py-2.5 text-center text-xs font-bold', isActive ? 'bg-brand text-white' : 'text-muted')
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
