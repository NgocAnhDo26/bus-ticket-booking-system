import { apiClient } from '@/lib/api-client';

import {
  type MetricsResponse,
  type RevenueChartResponse,
  type TopOperatorResponse,
  type TopRouteResponse,
  type TransactionResponse,
} from './types';

export const fetchMetrics = async (): Promise<MetricsResponse> => {
  const response = await apiClient.get<MetricsResponse>('/admin/dashboard/metrics');
  return response.data;
};

export const fetchRevenueChart = async (): Promise<RevenueChartResponse[]> => {
  const response = await apiClient.get<RevenueChartResponse[]>('/admin/dashboard/revenue');
  return response.data;
};

export const fetchTopRoutes = async (): Promise<TopRouteResponse[]> => {
  const response = await apiClient.get<TopRouteResponse[]>('/admin/dashboard/top-routes');
  return response.data;
};

export const fetchRecentTransactions = async (): Promise<TransactionResponse[]> => {
  const response = await apiClient.get<TransactionResponse[]>(
    '/admin/dashboard/recent-transactions',
  );
  return response.data;
};

export const fetchTopOperators = async (): Promise<TopOperatorResponse[]> => {
  const response = await apiClient.get<TopOperatorResponse[]>('/admin/dashboard/top-operators');
  return response.data;
};
