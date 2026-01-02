import type { UserRole } from '@/types/user';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string | null;
  authProvider: 'LOCAL' | 'GOOGLE';
  enabled: boolean;
  createdAt: string;
}

export interface CreateAdminRequest {
  email: string;
  fullName: string;
  phone?: string;
  password?: string;
}

export interface UpdateAdminRequest {
  fullName: string;
  phone?: string;
}

export interface UserStatusRequest {
  enabled: boolean;
}

export interface UserQueryParams {
  page?: number;
  size?: number;
  role?: UserRole;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PageMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: PageMetadata;
}
