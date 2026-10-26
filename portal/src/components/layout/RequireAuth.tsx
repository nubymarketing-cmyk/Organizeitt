import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../hooks/useAuth';
import { isStaffRole } from '../../lib/roles';
import { Skeleton } from '../ui';

/** Protege rotas por papel: "staff" (agência) ou "client" (clínica). */
export function RequireAuth({ area }: { area: 'staff' | 'client' }) {
  const session = useSession();
  const location = useLocation();

  if (session.isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  const profile = session.data;
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const staff = isStaffRole(profile.role);
  if (area === 'staff' && !staff) return <Navigate to="/app" replace />;
  if (area === 'client' && staff) return <Navigate to="/agencia" replace />;
  return <Outlet />;
}

/** Redireciona da raiz conforme o papel (seção 7). */
export function HomeRedirect() {
  const session = useSession();
  if (session.isLoading) return null;
  if (!session.data) return <Navigate to="/login" replace />;
  return <Navigate to={isStaffRole(session.data.role) ? '/agencia' : '/app'} replace />;
}
