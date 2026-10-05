import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Public Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { HomePage } from '../pages/home/HomePage';
import { BrowseListingsPage } from '../pages/listings/BrowseListingsPage';
import { ListingDetailPage } from '../pages/listings/ListingDetailPage';
import { PublicProfilePage } from '../pages/profile/PublicProfilePage';

// Protected Pages
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { MyProfilePage } from '../pages/profile/MyProfilePage';
import { EditProfilePage } from '../pages/profile/EditProfilePage';
import { MyReportsPage } from '../pages/profile/MyReportsPage';
import { MyListingsPage } from '../pages/dashboard/MyListingsPage';
import { VerificationPage } from '../pages/kyc/VerificationPage';
import { VerificationStatusPage } from '../pages/kyc/VerificationStatusPage';

// Lazy Loaded Pages
const CreateListingPage = lazy(() => import('../pages/listings/CreateListingPage').then(module => ({ default: module.CreateListingPage })));
const EditListingPage = lazy(() => import('../pages/listings/EditListingPage').then(module => ({ default: module.EditListingPage })));
const ChatPage = lazy(() => import('../pages/chat/ChatPage').then(module => ({ default: module.ChatPage })));

// Admin Pages
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const ModerationQueuePage = lazy(() => import('../pages/admin/ModerationQueuePage').then(module => ({ default: module.ModerationQueuePage })));
const KYCQueuePage = lazy(() => import('../pages/admin/KYCQueuePage').then(module => ({ default: module.KYCQueuePage })));
const ReportManagementPage = lazy(() => import('../pages/admin/ReportManagementPage').then(module => ({ default: module.ReportManagementPage })));
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage').then(module => ({ default: module.UserManagementPage })));

// Error Pages
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { SuspendedPage } from '../pages/errors/SuspendedPage';

export const AppRouter = () => {
  const { user } = useAuthStore();

  // Globally intercept suspended or banned users
  if (user && (user.status === 'suspended' || user.status === 'banned')) {
    return <SuspendedPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Suspense fallback={<LoadingSpinner fullScreen />}><AdminDashboardPage /></Suspense>} />
          <Route path="/admin/moderation" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ModerationQueuePage /></Suspense>} />
          <Route path="/admin/kyc-queue" element={<Suspense fallback={<LoadingSpinner fullScreen />}><KYCQueuePage /></Suspense>} />
          <Route path="/admin/reports" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ReportManagementPage /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<LoadingSpinner fullScreen />}><UserManagementPage /></Suspense>} />
        </Route>
      </Route>

      {/* Main App Routes with Public Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        
        {/* Listing Routes */}
        <Route path="/listings" element={<BrowseListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        
        {/* User Profile */}
        <Route path="/user/:id" element={<PublicProfilePage />} />
        
        {/* Protected Routes (Require Login) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/reports" element={<MyReportsPage />} />
          <Route path="/dashboard/my-listings" element={<MyListingsPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/verify/status" element={<VerificationStatusPage />} />
        </Route>

        {/* Verified Routes (Require Login + Verification) */}
        <Route element={<ProtectedRoute requireVerified />}>
          <Route path="/listings/create" element={<Suspense fallback={<LoadingSpinner fullScreen />}><CreateListingPage /></Suspense>} />
          <Route path="/listings/:id/edit" element={<Suspense fallback={<LoadingSpinner fullScreen />}><EditListingPage /></Suspense>} />
          <Route path="/chat/:roomId?" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ChatPage /></Suspense>} />
        </Route>

        {/* 404 Not Found Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
