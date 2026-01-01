import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAdminBookings, refundBooking } from './api';
import { type AdminBookingFilters } from './types';

export const useAdminBookings = (params: AdminBookingFilters & { page: number; size: number }) => {
  return useQuery({
    queryKey: ['admin-bookings', params],
    queryFn: () => getAdminBookings(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useRefundBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => refundBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });
};
