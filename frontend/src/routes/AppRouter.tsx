import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';

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
import { CreateListingPage } from '../pages/listings/CreateListingPage';
import { EditListingPage } from '../pages/listings/EditListingPage';
import { ChatPage } from '../pages/chat/ChatPage';

// Admin Pages
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ModerationQueuePage } from '../pages/admin/ModerationQueuePage';
import { KYCQueuePage } from '../pages/admin/KYCQueuePage';
import { ReportManagementPage } from '../pages/admin/ReportManagementPage';

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
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/moderation" element={<ModerationQueuePage />} />
          <Route path="/admin/kyc-queue" element={<KYCQueuePage />} />
          <Route path="/admin/reports" element={<ReportManagementPage />} />
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
          <Route path="/listings/create" element={<CreateListingPage />} />
          <Route path="/listings/:id/edit" element={<EditListingPage />} />
          <Route path="/chat/:roomId?" element={<ChatPage />} />
        </Route>

        {/* 404 Not Found Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
