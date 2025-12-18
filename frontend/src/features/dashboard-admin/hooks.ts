import {
  useGetBookingConversion,
  useGetBookingTrends,
  useGetMetrics,
  useGetRecentTransactions,
  useGetRevenueChart,
  useGetTopOperators,
  useGetTopRoutes1,
} from '@/features/api/admin-dashboard/admin-dashboard';
import type {
  GetBookingConversionParams,
  GetBookingTrendsParams,
  GetRecentTransactionsParams,
  GetRevenueChartParams,
  GetTopOperatorsParams,
  GetTopRoutes1Params,
} from '@/model';

export const useAdminMetrics = () => useGetMetrics();

export const useAdminRevenue = (params?: GetRevenueChartParams) => useGetRevenueChart(params);

export const useAdminTopRoutes = (params?: GetTopRoutes1Params) => useGetTopRoutes1(params);

export const useAdminRecentTransactions = (params?: GetRecentTransactionsParams) =>
  useGetRecentTransactions(params);

export const useAdminTopOperators = (params?: GetTopOperatorsParams) => useGetTopOperators(params);

export const useAdminBookingTrends = (params?: GetBookingTrendsParams) =>
  useGetBookingTrends(params);

export const useAdminBookingConversion = (params?: GetBookingConversionParams) =>
  useGetBookingConversion(params);
