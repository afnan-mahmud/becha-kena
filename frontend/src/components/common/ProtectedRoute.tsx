import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  requireVerified?: boolean;
}

export const ProtectedRoute = ({ requireVerified = false }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !user?.isVerified) {
    return <Navigate to="/verify" replace />; // Redirect to verification page if required
  }

  return <Outlet />;
};
