import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { PublicRoute } from "@/components/common/public-route";
import { ProtectedRoute } from "@/components/common/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminDashboardPage } from "@/features/dashboard/pages/admin-dashboard-page";
import { useAuthStore } from "@/store/auth-store";
import { useHydrateAuth } from "@/features/auth/hooks";
import { getDashboardPath } from "@/lib/navigation";

const RoleDashboardRedirect = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
};

const AuthenticatedRedirect = () => {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  useHydrateAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return null;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
};

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["PASSENGER"]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/dashboard/*", element: <Navigate to="/dashboard" replace /> },
        ],
      },
      { path: "/", element: <RoleDashboardRedirect /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/admin/dashboard", element: <AdminDashboardPage /> },
          { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
          {
            path: "/admin/*",
            element: <Navigate to="/admin/dashboard" replace />,
          },
        ],
      },
    ],
  },
  { path: "*", element: <AuthenticatedRedirect /> },
]);
