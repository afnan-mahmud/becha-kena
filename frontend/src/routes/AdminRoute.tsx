import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

export const AdminRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== 'admin' && user.role !== 'moderator') {
      if (!showError) {
        toast.error('অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই');
        setShowError(true);
      }
    }
  }, [isLoading, isAuthenticated, user, showError]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
