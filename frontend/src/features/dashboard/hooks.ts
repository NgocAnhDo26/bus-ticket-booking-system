import { useQuery } from '@tanstack/react-query';

import { fetchDashboard, fetchUserDashboardSummary, fetchUserRecentTrips } from './api';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });
};

export const useUserDashboardSummary = () => {
  return useQuery({
    queryKey: ['userDashboardSummary'],
    queryFn: fetchUserDashboardSummary,
  });
};

export const useUserRecentTrips = () => {
  return useQuery({
    queryKey: ['userRecentTrips'],
    queryFn: fetchUserRecentTrips,
  });
};
