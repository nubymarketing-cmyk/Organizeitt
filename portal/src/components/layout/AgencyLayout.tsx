import { NavLink, Outlet } from 'react-router-dom';
import { useSession, useSignOut } from '../../hooks/useAuth';
import { ROLE_LABEL } from '../../lib/format';
import { cx } from '../ui';
import { Logo } from './Logo';

export function AgencyLayout() {
  const { data: profile } = useSession();
  const signOut = useSignOut();

  return (
    <div className="min-h-screen bg-night md:flex">
      <aside className="border-b border-line bg-panel px-5 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r md:py-6">
        <div className="flex items-center justify-between md:block">
          <div>
            <Logo small />
            <p className="text-xs text-dim">área da agência</p>
          </div>
          <nav className="flex gap-2 md:mt-8 md:flex-col">
            <NavLink
              to="/agencia"
              end
              className={({ isActive }) =>
                cx('rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-violet/20 text-white' : 'text-muted')
              }
            >
              Clientes
            </NavLink>
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
        <div className="mb-4 flex justify-end md:hidden">
          <button className="text-xs text-lilac" onClick={() => signOut.mutate()}>
            Sair
          </button>
        </div>
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
