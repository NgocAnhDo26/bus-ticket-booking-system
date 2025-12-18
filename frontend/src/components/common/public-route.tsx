import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/auth-store';

export const PublicRoute = () => {
  const token = useAuthStore((state) => state.accessToken);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
