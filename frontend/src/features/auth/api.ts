import {
  login as orvalLogin,
  loginWithGoogle as orvalLoginWithGoogle,
  logout as orvalLogout,
  register as orvalRegister,
} from '@/features/api/authentication/authentication';
import { me as orvalMe } from '@/features/api/users/users';
import {
  type ApiResponseAuthResponse,
  type ApiResponseUserResponse,
  type GoogleLoginRequest,
  type LoginRequest,
  type RegisterRequest,
  type UserResponse,
} from '@/model';
import { type UserProfile } from '@/types/user';

type AuthData = {
  accessToken: string;
  user: UserProfile;
};

const toUserProfile = (user: UserResponse | undefined): UserProfile | null => {
  if (!user?.id || !user.email || !user.fullName || !user.role) return null;
  // Backend enum currently exposes PASSENGER/ADMIN; app also allows STAFF.
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as UserProfile['role'],
    avatarUrl: user.avatarUrl ?? undefined,
  };
};

const unwrapAuth = (resp: ApiResponseAuthResponse): AuthData => {
  const accessToken = resp.data?.accessToken;
  const user = toUserProfile(resp.data?.user);
  if (!accessToken || !user) {
    throw new Error(resp.message ?? 'Invalid auth response');
  }
  return { accessToken, user };
};

export const register = async (payload: RegisterRequest) => {
  await orvalRegister(payload);
  // No return value logic as backend returns void/message now.
  // The mutation onSuccess in RegisterPage handles the flow.
};

export const login = async (payload: LoginRequest) => {
  const resp = await orvalLogin(payload);
  return unwrapAuth(resp);
};

export const loginWithGoogle = async ({ credential }: GoogleLoginRequest) => {
  const resp = await orvalLoginWithGoogle({ credential });
  return unwrapAuth(resp);
};

export const fetchCurrentUser = async () => {
  const resp: ApiResponseUserResponse = await orvalMe();
  const user = toUserProfile(resp.data);
  if (!user) throw new Error(resp.message ?? 'Invalid user response');
  return user;
};

export const logout = async () => {
  await orvalLogout();
};
