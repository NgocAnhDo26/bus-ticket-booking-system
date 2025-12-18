import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createBusLayout,
  deleteBusLayout,
  getBusLayout,
  getBusLayouts,
  updateBusLayout,
} from './api';
import { type CreateBusLayoutPayload } from './types';

export const useBusLayouts = () =>
  useQuery({
    queryKey: ['bus-layouts'],
    queryFn: getBusLayouts,
  });

export const useBusLayout = (id: string | undefined) =>
  useQuery({
    queryKey: ['bus-layouts', id],
    queryFn: () => getBusLayout(id!),
    enabled: !!id,
  });

export const useCreateBusLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['bus-layouts', 'create'],
    mutationFn: (payload: CreateBusLayoutPayload) => createBusLayout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-layouts'] });
    },
  });
};

export const useUpdateBusLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['bus-layouts', 'update'],
    mutationFn: ({ id, data }: { id: string; data: CreateBusLayoutPayload }) =>
      updateBusLayout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-layouts'] });
    },
  });
};

export const useDeleteBusLayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['bus-layouts', 'delete'],
    mutationFn: (id: string) => deleteBusLayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-layouts'] });
    },
  });
};
