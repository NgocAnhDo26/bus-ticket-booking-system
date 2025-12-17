import { type UserProfile } from '@/types/user';

export type AuthResponse = {
  status: number;
  message: string;
  data: {
    accessToken: string;
    user: UserProfile;
  };
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type GoogleLoginRequest = {
  credential: string;
};
