import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth-store";
import { type AuthResponse } from "@/features/auth/types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

const requestRefresh = async () => {
  try {
    const refreshResponse = await refreshClient.post<AuthResponse>(
      "/auth/refresh",
    );
    const authData = refreshResponse.data.data;
    useAuthStore.getState().setAuth(authData);
    return authData.accessToken;
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
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
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
