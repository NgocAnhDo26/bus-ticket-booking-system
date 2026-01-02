import { useEffect, useState } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute, PublicRoute } from '@/components/common';
import { DashboardLayout } from '@/components/layout';
import { AdminDashboardLayout } from '@/components/layout/AdminLayout';
import { UserDashboardLayout } from '@/components/layout/UserDashboardLayout';
import { BookingManagementPage } from '@/features/admin-booking';
import {
  ActivationPage,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/features/auth';
import { useHydrateAuth } from '@/features/auth/hooks';
import { BookingLookupPage, BookingPage, PassengerInfoPage } from '@/features/booking';
import { BookingConfirmationPage } from '@/features/booking/pages/BookingConfirmationPage';
import { BusLayoutCreatePage, BusLayoutManagementPage } from '@/features/bus-layout';
import {
  BusManagementPage,
  OperatorManagementPage,
  RouteFormPage,
  RouteManagementPage,
  StationManagementPage,
  TripFormPage,
  TripManagementPage,
} from '@/features/catalog';
import { UserDashboardPage } from '@/features/dashboard';
import { AdminDashboardPage } from '@/features/dashboard-admin';
import { AboutPage } from '@/features/home/pages/AboutPage';
import { ContactPage } from '@/features/home/pages/ContactPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { SearchResultsPage } from '@/features/search/pages/SearchResultsPage';
import { TripDetailsPage } from '@/features/search/pages/TripDetailsPage';
import { getDashboardPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth-store';

const AuthenticatedRedirect = () => {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [isHydrating, setIsHydrating] = useState(true);

  useHydrateAuth();

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isHydrating && token && !user) {
    return null;
  }

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
    element: <DashboardLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/search',
        element: <SearchResultsPage />,
      },
      {
        path: '/trips/:tripId',
        element: <TripDetailsPage />,
      },
      {
        path: '/booking/:tripId',
        element: <BookingPage />,
      },
      {
        path: '/booking/:tripId/details',
        element: <PassengerInfoPage />,
      },
      {
        path: '/booking/confirmation/:bookingId',
        element: <BookingConfirmationPage />,
      },
      {
        path: '/booking/lookup',
        element: <BookingLookupPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/contact',
        element: <ContactPage />,
      },
      {
        element: <ProtectedRoute allowedRoles={['PASSENGER']} />,
        children: [
          {
            element: <UserDashboardLayout />,
            children: [
              { path: '/dashboard', element: <UserDashboardPage /> },
              {
                path: '/dashboard/bookings',
                element: <Navigate to="/dashboard?tab=tickets" replace />,
              },
              {
                path: '/dashboard/*',
                element: <Navigate to="/dashboard" replace />,
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['PASSENGER', 'ADMIN', 'STAFF']} />,
        children: [{ path: '/profile', element: <Navigate to="/dashboard?tab=profile" replace /> }],
      },
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/activate', element: <ActivationPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        element: <AdminDashboardLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
          { path: '/admin/bookings', element: <BookingManagementPage /> },
          {
            path: '/admin/catalog/stations',
            element: <StationManagementPage />,
          },
          {
            path: '/admin/catalog/operators',
            element: <OperatorManagementPage />,
          },
          { path: '/admin/catalog/buses', element: <BusManagementPage /> },
          {
            path: '/admin/catalog/routes',
            element: <RouteManagementPage />,
          },
          {
            path: '/admin/catalog/trips/create',
            element: <TripFormPage />,
          },
          {
            path: '/admin/catalog/trips/edit/:id',
            element: <TripFormPage />,
          },
          {
            path: '/admin/catalog/trips',
            element: <TripManagementPage />,
          },
          {
            path: '/admin/catalog/routes/create',
            element: <RouteFormPage />,
          },
          {
            path: '/admin/catalog/routes/edit/:id',
            element: <RouteFormPage />,
          },
          {
            path: '/admin/catalog/layouts',
            element: <BusLayoutManagementPage />,
          },
          {
            path: '/admin/catalog/layouts/create',
            element: <BusLayoutCreatePage />,
          },
          {
            path: '/admin/catalog/layouts/edit/:id',
            element: <BusLayoutCreatePage />,
          },
          {
            path: '/admin',
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: '/admin/*',
            element: <Navigate to="/admin/dashboard" replace />,
          },
        ],
      },
    ],
  },
  { path: '*', element: <AuthenticatedRedirect /> },
]);
