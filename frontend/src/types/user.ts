export type UserRole = 'PASSENGER' | 'ADMIN' | 'STAFF';

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
};
