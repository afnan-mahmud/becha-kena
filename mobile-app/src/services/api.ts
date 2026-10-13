import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL, ENDPOINTS } from '@/constants/api';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from '@/lib/storage';
import { ApiResponse, ApiErrorBody, ApiError } from '@/types/api.types';

export { ApiError };

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Bearer token from SecureStore
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Token refresh (single-flight) ────────────────────────────────────────────
// Only ONE refresh request runs at a time; every caller waiting on a 401 shares it.
let refreshPromise: Promise<string> | null = null;

/**
 * POST /auth/refresh with the stored refresh token, saves the new access token
 * and returns it. Throws if there is no refresh token or the server rejects it.
 * Also used by the socket client (lib/socket.ts) when its token has expired.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

      // Plain axios (not `api`) so this request never goes through the interceptors
      const res = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_URL}${ENDPOINTS.AUTH.REFRESH}`,
        { refreshToken },
        { timeout: 15000 }
      );
      const accessToken = res.data?.data?.accessToken;
      if (!accessToken) throw new Error('REFRESH_FAILED');

      // The refresh token is not rotated by the backend — keep the current one
      await saveTokens({ accessToken, refreshToken });
      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const forceLocalLogout = async () => {
  try {
    // Lazy require avoids a circular import (auth.store imports this file)
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require breaks an import cycle
    const { useAuthStore } = require('@/store/auth.store');
    await useAuthStore.getState().localLogout();
  } catch {
    await clearTokens();
    router.replace('/(auth)/login');
  }
};

// Response Interceptor: 401 Refresh, 403 Suspended/KYC, and Error Normalization
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If network error (no response received or offline)
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          message: 'ইন্টারনেট সংযোগ পরীক্ষা করুন',
          code: 'NETWORK_ERROR',
          status: 0,
        })
      );
    }

    const { status, data } = error.response;
    const url = originalRequest?.url || '';

    // Handle 401 Unauthorized (except on /auth/* routes): refresh once, then retry
    if (status === 401 && !url.includes('/auth/') && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        // A network failure while refreshing is not a reason to log out
        if (isAxiosError(refreshErr) && !refreshErr.response) {
          return Promise.reject(
            new ApiError({ message: 'ইন্টারনেট সংযোগ পরীক্ষা করুন', code: 'NETWORK_ERROR', status: 0 })
          );
        }
        await forceLocalLogout();
        return Promise.reject(
          new ApiError({
            message: 'লগইনের মেয়াদ শেষ হয়েছে, পুনরায় লগইন করুন',
            code: 'SESSION_EXPIRED',
            status: 401,
          })
        );
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      if (data?.code === 'ACCOUNT_SUSPENDED') {
        await forceLocalLogout();
        Alert.alert(
          'অ্যাকাউন্ট স্থগিত',
          'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। সহায়তার জন্য প্রশাসকের সাথে যোগাযোগ করুন।'
        );
      } else if (data?.code === 'VERIFICATION_REQUIRED') {
        router.push('/(app)/kyc');
      }
    }

    // Normalized typed ApiError
    return Promise.reject(
      new ApiError({
        message: data?.error || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে',
        code: data?.code || 'UNKNOWN_ERROR',
        status,
        details: data?.details,
      })
    );
  }
);

// Typed API Client helpers
export const apiClient = {
  get: async <T>(url: string, params?: unknown): Promise<T> => {
    const res = await api.get<ApiResponse<T>>(url, { params });
    return res.data.data;
  },

  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const res = await api.post<ApiResponse<T>>(url, data);
    return res.data.data;
  },

  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const res = await api.put<ApiResponse<T>>(url, data);
    return res.data.data;
  },

  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const res = await api.patch<ApiResponse<T>>(url, data);
    return res.data.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const res = await api.delete<ApiResponse<T>>(url);
    return res.data.data;
  },
};
