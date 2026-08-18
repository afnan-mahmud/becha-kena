import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

interface VerifiedRouteProps {
  children: React.ReactNode;
}

export const VerifiedRoute = ({ children }: VerifiedRouteProps) => {
  const { isAuthenticated, isVerified, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isVerified) {
      toast.error('Please complete identity verification first.');
    }
  }, [isLoading, isAuthenticated, isVerified]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!isVerified) {
    return <Navigate to="/verify" replace />;
  }

  return <>{children}</>;
};
