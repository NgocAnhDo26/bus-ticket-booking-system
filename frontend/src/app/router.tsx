import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage, RegisterPage } from "@/features/auth";
import { DashboardLayout } from "@/components/layout";
import { DashboardPage } from "@/features/dashboard";
import { AdminDashboardLayout } from "@/components/layout/AdminLayout";
import { AdminDashboardPage } from "@/features/dashboard-admin";
import { PublicRoute, ProtectedRoute } from "@/components/common";
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
          {
            path: "/dashboard/*",
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
      { path: "/", element: <RoleDashboardRedirect /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        element: <AdminDashboardLayout />,
        children: [
          { path: "/admin/dashboard", element: <AdminDashboardPage /> },
          {
            path: "/admin",
            element: <Navigate to="/admin/dashboard" replace />,
          },
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
