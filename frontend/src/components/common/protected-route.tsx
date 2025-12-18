import { Navigate, Outlet } from 'react-router-dom';

import { useHydrateAuth } from '@/features/auth/hooks';
import { getDashboardPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth-store';
import { type UserRole } from '@/types/user';

type ProtectedRouteProps = {
  allowGuests?: boolean;
  allowedRoles?: UserRole[];
};

export const ProtectedRoute = ({ allowGuests = false, allowedRoles }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);

  useHydrateAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowGuests && !user) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
};
