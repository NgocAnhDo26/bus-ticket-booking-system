import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createReview, getOperatorStats, getReviewByBookingId, getReviewsByOperator } from './api';
import type { CreateReviewRequest } from './api';

export const useReviewsByOperator = (operatorId: string | undefined, page = 0, size = 10) => {
  return useQuery({
    queryKey: ['reviews', 'operator', operatorId, page, size],
    queryFn: () => getReviewsByOperator(operatorId!, page, size),
    enabled: !!operatorId,
  });
};

export const useOperatorStats = (operatorId: string | undefined) => {
  return useQuery({
    queryKey: ['reviews', 'operator', operatorId, 'stats'],
    queryFn: () => getOperatorStats(operatorId!),
    enabled: !!operatorId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to reduce API calls
  });
};

export const useReviewByBookingId = (bookingId: string | undefined) => {
  return useQuery({
    queryKey: ['review', 'booking', bookingId],
    queryFn: () => getReviewByBookingId(bookingId!),
    enabled: !!bookingId,
    retry: false,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateReviewRequest) => createReview(request),
    onSuccess: (_data, variables) => {
      // Invalidate reviews for the operator
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Invalidate the specific booking review
      queryClient.invalidateQueries({ queryKey: ['review', 'booking', variables.bookingId] });
    },
  });
};
