import { useEffect, useState } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute, PublicRoute } from '@/components/common';
import { DashboardLayout } from '@/components/layout';
import { AdminDashboardLayout } from '@/components/layout/AdminLayout';
import { LoginPage, RegisterPage } from '@/features/auth';
import { useHydrateAuth } from '@/features/auth/hooks';
import { BookingLookupPage, BookingPage, PassengerInfoPage } from '@/features/booking';
import { BookingConfirmationPage } from '@/features/booking/pages/BookingConfirmationPage';
import { BookingHistoryPage } from '@/features/booking/pages/BookingHistoryPage';
import { BusLayoutCreatePage, BusLayoutManagementPage } from '@/features/bus-layout';
import {
    BusManagementPage,
    OperatorManagementPage,
    RouteManagementPage,
    StationManagementPage,
    TripManagementPage,
} from '@/features/catalog';
import { DashboardPage } from '@/features/dashboard';
import { AdminDashboardPage } from '@/features/dashboard-admin';
import { HomePage } from '@/features/home/pages/HomePage';
import { SearchResultsPage } from '@/features/search/pages/SearchResultsPage';
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
                element: <ProtectedRoute allowedRoles={['PASSENGER']} />,
                children: [
                    { path: '/dashboard', element: <DashboardPage /> },
                    { path: '/dashboard/bookings', element: <BookingHistoryPage /> },
                    {
                        path: '/dashboard/*',
                        element: <Navigate to="/dashboard" replace />,
                    },
                ],
            },
        ],
    },
    {
        element: <PublicRoute />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
        ],
    },
    {
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [
            {
                element: <AdminDashboardLayout />,
                children: [
                    { path: '/admin/dashboard', element: <AdminDashboardPage /> },
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
                        path: '/admin/catalog/trips',
                        element: <TripManagementPage />,
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
