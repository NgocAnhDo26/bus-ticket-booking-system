import { apiClient } from '@/lib/api-client';

import { getMockDashboard } from './mocks';
import type { DashboardResponse, UserDashboardSummary, UserRecentTrip } from './types';

type DashboardApiResponse = {
  status: number;
  message: string;
  data: DashboardResponse;
};

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  try {
    const response = await apiClient.get<DashboardApiResponse>('/dashboard/summary');
    return response.data.data;
  } catch {
    return getMockDashboard();
  }
};

export const fetchUserDashboardSummary = async (): Promise<UserDashboardSummary> => {
  const response = await apiClient.get<UserDashboardSummary>('/dashboard/user/summary');
  return response.data;
};

export const fetchUserRecentTrips = async (): Promise<UserRecentTrip[]> => {
  const response = await apiClient.get<UserRecentTrip[]>('/dashboard/user/recent-trips');
  return response.data;
};
