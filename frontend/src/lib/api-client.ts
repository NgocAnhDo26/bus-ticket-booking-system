import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { ApiResponseAuthResponse, UserResponse } from '@/model';
import { useAuthStore } from '@/store/auth-store';
import type { UserProfile, UserRole } from '@/types/user';

// `__API_BASE_URL__` should be the server origin (e.g. `http://localhost:8080`).
// For backward compatibility, we also accept values that end with `/api` and strip it once.
const RAW_BASE_URL =
  typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : 'http://localhost:8080';
const API_BASE_URL = RAW_BASE_URL.replace(/\/api\/?$/, '');

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const serializeParams = (params: unknown): string => {
  if (!params) return '';
  if (params instanceof URLSearchParams) return params.toString();

  const sp = new URLSearchParams();

  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => append(key, v));
      return;
    }
    sp.append(key, String(value));
  };

  const flattenOneLevel = (obj: Record<string, unknown>) => {
    Object.entries(obj).forEach(([k, v]) => append(k, v));
  };

  if (typeof params === 'object') {
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof URLSearchParams)
      ) {
        // Spring `@ParameterObject` patterns often wrap query params in objects
        // like `{ request: {...} }` or `{ pageable: {...} }`. Flatten one level.
        flattenOneLevel(value as Record<string, unknown>);
      } else {
        append(key, value);
      }
    });
  }

  return sp.toString();
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  paramsSerializer: {
    serialize: serializeParams,
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  paramsSerializer: {
    serialize: serializeParams,
  },
});

let refreshPromise: Promise<string | null> | null = null;

const toUserProfile = (user: UserResponse | undefined): UserProfile | null => {
  if (!user?.id || !user.email || !user.fullName || !user.role) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as UserRole,
    avatarUrl: user.avatarUrl ?? undefined,
  };
};

const requestRefresh = async () => {
  try {
    const refreshResponse = await refreshClient.post<ApiResponseAuthResponse>('/api/auth/refresh');
    const authData = refreshResponse.data?.data;
    const accessToken = authData?.accessToken ?? null;
    const user = toUserProfile(authData?.user);

    if (accessToken && user) {
      useAuthStore.getState().setAuth({
        accessToken,
        user,
      });
      return accessToken;
    }

    useAuthStore.getState().clearAuth();
    return null;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
};

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      refreshPromise = refreshPromise ?? requestRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();

  const promise = apiClient({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error - Adding cancel method to promise for query cancellation support
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};
