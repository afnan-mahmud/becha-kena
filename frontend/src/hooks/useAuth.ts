import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { verifyOTP as verifyOTPApi, logout as logoutApi, requestOTP as requestOTPApi } from '../services/auth.service';

export const useAuth = () => {
  const store = useAuthStore();

  const login = useCallback(async (phoneNumber: string, otpCode: string) => {
    const response = await verifyOTPApi(phoneNumber, otpCode);
    if (response.success && response.data?.user) {
      store.setUser(response.data.user);
    }
    return response;
  }, [store]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      store.clearUser();
      window.location.href = '/';
    }
  }, [store]);

  const requestOTP = useCallback(async (phoneNumber: string) => {
    return await requestOTPApi(phoneNumber);
  }, []);

  return {
    ...store,
    login,
    logout,
    requestOTP,
  };
};
