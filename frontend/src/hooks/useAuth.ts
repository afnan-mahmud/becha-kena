import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout as logoutApi } from '../services/auth.service';

export const useLogout = () => {
  const clearUser = useAuthStore((s) => s.clearUser);
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      clearUser();
      navigate('/', { replace: true });
    }
  }, [clearUser, navigate]);
};

/** Sends the user to login / KYC first when an action needs a verified account */
export const useRequireVerified = () => {
  const { isAuthenticated, isVerified } = useAuthStore();
  const navigate = useNavigate();

  return useCallback(
    (redirectTo: string) => {
      if (!isAuthenticated) {
        navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return false;
      }
      if (!isVerified) {
        navigate('/verify');
        return false;
      }
      return true;
    },
    [isAuthenticated, isVerified, navigate]
  );
};
