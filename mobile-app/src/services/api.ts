import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL, ENDPOINTS } from '@/constants/api';
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from '@/lib/storage';
import { ApiResponse, ApiErrorResponse } from '@/types/api.types';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: string[];

  constructor({
    message,
    code,
    status,
    details,
  }: {
    message: string;
    code: string;
    status: number;
    details?: string[];
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

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

// Token refresh queue management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: 401 Refresh, 403 Suspended/KYC, and Error Normalization
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
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

    // Handle 401 Unauthorized (except on /auth/* routes)
    if (status === 401 && !url.includes('/auth/') && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('NO_REFRESH_TOKEN');
        }

        // Call POST /auth/refresh with axios directly to avoid interceptor loop
        const refreshResponse = await axios.post<{
          success: boolean;
          data: { accessToken: string };
        }>(`${API_URL}${ENDPOINTS.AUTH.REFRESH}`, {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('REFRESH_FAILED');
        }

        // Save new access token (keeps the current refresh token)
        await saveTokens({
          accessToken: newAccessToken,
          refreshToken,
        });

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        try {
          const { useAuthStore } = require('@/store/auth.store');
          useAuthStore.getState().localLogout();
        } catch {
          await clearTokens();
          router.replace('/(auth)/login');
        }
        return Promise.reject(
          new ApiError({
            message: 'লগইনের মেয়াদ শেষ হয়েছে, পুনরায় লগইন করুন',
            code: 'SESSION_EXPIRED',
            status: 401,
          })
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      if (data?.code === 'ACCOUNT_SUSPENDED') {
        try {
          const { useAuthStore } = require('@/store/auth.store');
          useAuthStore.getState().localLogout();
        } catch {
          await clearTokens();
          router.replace('/(auth)/login');
        }
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
