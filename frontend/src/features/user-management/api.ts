import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { customInstance } from '@/lib/api-client';
import type { UserRole } from '@/types/user';

import type {
  AdminUser,
  ApiResponse,
  CreateAdminRequest,
  PaginatedResponse,
  UpdateAdminRequest,
  UserQueryParams,
  UserStatusRequest,
} from './types';

// API Functions
const getUsers = async (params: UserQueryParams) => {
  const response = await customInstance<ApiResponse<PaginatedResponse<AdminUser>>>({
    url: '/api/admin/users',
    method: 'GET',
    params,
  });
  return response.data;
};

const createAdmin = async (data: CreateAdminRequest) => {
  const response = await customInstance<ApiResponse<AdminUser>>({
    url: '/api/admin/users',
    method: 'POST',
    data,
  });
  return response.data;
};

const updateAdmin = async ({ id, data }: { id: string; data: UpdateAdminRequest }) => {
  const response = await customInstance<ApiResponse<AdminUser>>({
    url: `/api/admin/users/${id}`,
    method: 'PUT',
    data,
  });
  return response.data;
};

const setUserStatus = async ({ id, enabled }: { id: string; enabled: boolean }) => {
  const response = await customInstance<ApiResponse<AdminUser>>({
    url: `/api/admin/users/${id}/status`,
    method: 'PUT',
    data: { enabled } as UserStatusRequest,
  });
  return response.data;
};

// Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (role?: UserRole, page?: number, size?: number) =>
    [...userKeys.lists(), { role, page, size }] as const,
};

// Hooks
export const useUsers = (params: UserQueryParams) => {
  return useQuery({
    queryKey: userKeys.list(params.role, params.page, params.size),
    queryFn: () => getUsers(params),
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useSetUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
