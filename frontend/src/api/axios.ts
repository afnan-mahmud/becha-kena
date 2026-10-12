import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints answer 401 for a wrong OTP etc. — never try to refresh on those
const isAuthEndpoint = (url?: string) => !!url && url.startsWith('/auth/');

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;
      try {
        // Share one refresh call between parallel failing requests
        refreshPromise ??= axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        await refreshPromise;
        return api(originalRequest);
      } catch {
        const protectedPath = !['/', '/login', '/listings'].includes(window.location.pathname)
          && !window.location.pathname.startsWith('/listings/')
          && !window.location.pathname.startsWith('/user/');
        if (originalRequest.url !== '/users/me' && protectedPath) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(new Error('আপনার সেশনের মেয়াদ শেষ। আবার লগইন করুন।'));
      } finally {
        refreshPromise = null;
      }
    }

    if (error.response?.status === 403) {
      const errorData = error.response.data as { code?: string; error?: string };
      if (errorData?.code === 'ACCOUNT_SUSPENDED') {
        if (window.location.pathname !== '/suspended') {
          window.location.href = '/suspended';
        }
      } else if (errorData?.code === 'VERIFICATION_REQUIRED') {
        if (window.location.pathname !== '/verify') {
          window.location.href = '/verify';
        }
      }
    }

    if (!error.response) {
      return Promise.reject(new Error('ইন্টারনেট সংযোগ পরীক্ষা করুন।'));
    }

    const data = error.response.data as { error?: string; details?: string[] } | undefined;
    const details = data?.details?.length ? ` (${data.details.join(', ')})` : '';
    const errorMessage = data?.error ? `${data.error}${details}` : error.message;
    const wrapped = new Error(errorMessage) as Error & { code?: string; status?: number };
    wrapped.code = (error.response.data as { code?: string })?.code;
    wrapped.status = error.response.status;
    return Promise.reject(wrapped);
  }
);

export default api;
