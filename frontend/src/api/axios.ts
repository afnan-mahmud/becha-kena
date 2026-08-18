import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        // Handle failed refresh
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      const errorData = error.response.data as { code?: string; error?: string };
      if (errorData?.code === 'ACCOUNT_SUSPENDED') {
        window.location.href = '/suspended';
      } else if (errorData?.code === 'VERIFICATION_REQUIRED') {
        window.location.href = '/verify';
      }
    }

    const errorMessage = (error.response?.data as any)?.error || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
