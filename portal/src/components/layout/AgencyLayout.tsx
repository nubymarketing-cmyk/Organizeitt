import { NavLink, Outlet } from 'react-router-dom';
import { useIsPlatformAdmin } from '../../hooks/useAgency';
import { useSession, useSignOut } from '../../hooks/useAuth';
import { ROLE_LABEL } from '../../lib/format';
import { cx } from '../ui';
import { Logo } from './Logo';

export function AgencyLayout() {
  const { data: profile } = useSession();
  const platform = useIsPlatformAdmin();
  const signOut = useSignOut();
  const isAdmin = profile?.role === 'agency_admin';
  const items = [
    { to: '/agencia', label: 'Visão geral', end: true, show: true },
    { to: '/agencia/clientes', label: 'Clientes', show: true },
    { to: '/agencia/calendario', label: 'Calendário', show: true },
    { to: '/agencia/posts', label: 'Posts', end: true, show: true },
    { to: '/agencia/equipe', label: 'Equipe', show: isAdmin },
    { to: '/agencia/configuracoes', label: 'Configurações', show: isAdmin },
    { to: '/plataforma', label: 'Plataforma', show: !!platform.data },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen bg-night md:flex">
      <aside className="border-b border-line bg-panel px-5 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r md:py-6">
        <div className="flex items-center justify-between md:block">
          <div>
            <Logo small />
            <p className="text-xs text-dim">área da agência</p>
          </div>
          <nav className="-mr-2 flex gap-1 overflow-x-auto md:mr-0 md:mt-8 md:flex-col">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  cx('whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-violet/20 text-white' : 'text-muted')
                }
              >
                {i.label}
              </NavLink>
            ))}
            <button className="rounded-lg px-3 py-2 text-sm text-lilac md:hidden" onClick={() => signOut.mutate()}>
              Sair
            </button>
          </nav>
        </div>
        <div className="mt-4 hidden border-t border-line pt-4 text-sm md:absolute md:bottom-6 md:left-5 md:right-5 md:block">
          <p className="font-semibold text-white">{profile?.full_name}</p>
          <p className="text-xs text-dim">{profile ? ROLE_LABEL[profile.role] : ''}</p>
          <button className="mt-2 text-xs text-lilac" onClick={() => signOut.mutate()}>
            Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
