import { useQuery } from '@tanstack/react-query';

import {
  fetchMetrics,
  fetchRecentTransactions,
  fetchRevenueChart,
  fetchTopOperators,
  fetchTopRoutes,
} from './api';

export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchMetrics,
  });
};

export const useAdminRevenue = () => {
  return useQuery({
    queryKey: ['admin-revenue'],
    queryFn: fetchRevenueChart,
  });
};

export const useAdminTopRoutes = () => {
  return useQuery({
    queryKey: ['admin-top-routes'],
    queryFn: fetchTopRoutes,
  });
};

export const useAdminRecentTransactions = () => {
  return useQuery({
    queryKey: ['admin-recent-transactions'],
    queryFn: fetchRecentTransactions,
  });
};

export const useAdminTopOperators = () => {
  return useQuery({
    queryKey: ['admin-top-operators'],
    queryFn: fetchTopOperators,
  });
};
