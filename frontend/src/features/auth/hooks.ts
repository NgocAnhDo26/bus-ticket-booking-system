import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth-store';

import { fetchCurrentUser } from './api';

export const useHydrateAuth = () => {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data, error } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
    enabled: Boolean(token && !user),
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      updateUser(data);
    }
  }, [data, updateUser]);

  useEffect(() => {
    if (error) {
      clearAuth();
    }
  }, [error, clearAuth]);
};
