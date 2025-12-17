import { apiClient } from '@/lib/api-client';
import { type UserProfile } from '@/types/user';

import {
  type AuthResponse,
  type GoogleLoginRequest,
  type LoginRequest,
  type RegisterRequest,
} from './types';

export const register = async (payload: RegisterRequest) => {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data.data;
};

export const login = async (payload: LoginRequest) => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data.data;
};

export const loginWithGoogle = async ({ credential }: GoogleLoginRequest) => {
  const response = await apiClient.post<AuthResponse>('/auth/google', {
    credential,
  });
  return response.data.data;
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get<UserProfile>('/users/me');
  return data;
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
};
