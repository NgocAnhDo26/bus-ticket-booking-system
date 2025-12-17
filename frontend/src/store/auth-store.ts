import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type UserProfile } from '@/types/user';

type AuthState = {
  user: UserProfile | null;
  accessToken: string | null;
};

type AuthActions = {
  setAuth: (payload: { user: UserProfile; accessToken: string }) => void;
  updateUser: (user: UserProfile | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: ({ user, accessToken }) => set({ user, accessToken }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'btb-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
