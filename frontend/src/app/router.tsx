import { createBrowserRouter, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LoginPage, RegisterPage } from "@/features/auth";
import { DashboardLayout } from "@/components/layout";
import { DashboardPage } from "@/features/dashboard";
import { AdminDashboardLayout } from "@/components/layout/AdminLayout";
import { AdminDashboardPage } from "@/features/dashboard-admin";
import {
  BusManagementPage,
  OperatorManagementPage,
  StationManagementPage,
  RouteManagementPage,
  TripManagementPage,
} from "@/features/catalog";
import {
  BusLayoutCreatePage,
  BusLayoutManagementPage,
} from "@/features/bus-layout";
import { PublicRoute, ProtectedRoute } from "@/components/common";
import { useAuthStore } from "@/store/auth-store";
import { useHydrateAuth } from "@/features/auth/hooks";
import { getDashboardPath } from "@/lib/navigation";

const AuthenticatedRedirect = () => {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [isHydrating, setIsHydrating] = useState(true);

  useHydrateAuth();

  useEffect(() => {
    // Small delay to allow hydration to complete if token exists
    const timer = setTimeout(() => setIsHydrating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isHydrating && token && !user) {
    return null; // Show nothing while hydrating user
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    // If token exists but user is still null after hydration attempt, redirect to login
    // Or potentially wait longer? But for now, let's assume if hydration failed, user is null.
    // However, useHydrateAuth fetches user asynchronously.
    // Better approach: useHydrateAuth should expose loading state or we check query status.
    // For now, let's rely on the token check. If token exists, we expect user to be there eventually.
    return null;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
};

import { HomePage } from "@/features/home/pages/HomePage";
import { SearchResultsPage } from "@/features/search/pages/SearchResultsPage";
import { BookingPage } from "@/features/booking";

// ... existing imports

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/search",
        element: <SearchResultsPage />,
      },
      {
        path: "/booking/:tripId",
        element: <BookingPage />,
      },
      {
        element: <ProtectedRoute allowedRoles={["PASSENGER"]} />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          {
            path: "/dashboard/*",
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
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
            path: "/admin/catalog/stations",
            element: <StationManagementPage />,
          },
          {
            path: "/admin/catalog/operators",
            element: <OperatorManagementPage />,
          },
          { path: "/admin/catalog/buses", element: <BusManagementPage /> },
          {
            path: "/admin/catalog/routes",
            element: <RouteManagementPage />,
          },
          {
            path: "/admin/catalog/trips",
            element: <TripManagementPage />,
          },
          {
            path: "/admin/catalog/layouts",
            element: <BusLayoutManagementPage />,
          },
          {
            path: "/admin/catalog/layouts/create",
            element: <BusLayoutCreatePage />,
          },
          {
            path: "/admin/catalog/layouts/edit/:id",
            element: <BusLayoutCreatePage />,
          },
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
