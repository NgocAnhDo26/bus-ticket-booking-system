export type UserRole = 'PASSENGER' | 'ADMIN' | 'STAFF';

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK';

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  authProvider?: AuthProvider;
};
