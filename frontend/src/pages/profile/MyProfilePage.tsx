import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar, Edit, List, MessageSquare, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { getReviewsForUser } from '../../services/review.service';
import { deleteAccount } from '../../services/user.service';
import { formatDate } from '../../utils/formatters';

import { UserAvatar } from '../../components/ui/UserAvatar';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { RatingStars } from '../../components/ui/RatingStars';
import { ReviewCard } from '../../components/ui/ReviewCard';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import './MyProfilePage.css';

export const MyProfilePage = () => {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: () => getReviewsForUser(user!.id, 1),
    enabled: !!user?.id
  });

  const reviews = reviewsData?.data?.items || [];

  // Safely fallback if user isn't loaded yet
  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('আপনার অ্যাকাউন্ট ডিলিট করা হয়েছে।');
      clearUser();
      navigate('/');
    } catch (error) {
      toast.error('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  return (
    <div className="profile-page container">
      <div className="profile-header-card">
        <UserAvatar name={user.displayName || 'U'} size="xl" />
        
        <h1 className="profile-name">
          {user.displayName || 'নামহীন ব্যবহারকারী'}
          {user.isVerified && <VerifiedBadge size="md" />}
        </h1>
        
        {user.verifiedName && (
          <div className="verified-name-text">আইনত যাচাইকৃত নাম: {user.verifiedName}</div>
        )}

        <div className="profile-meta-row">
          <div className="profile-meta-item">
            <RatingStars rating={user.averageRating} count={user.totalReviews} showCount />
          </div>
          <div className="profile-meta-item">
            <Calendar size={16} />
            <span>সদস্য: {formatDate(user.createdAt)}</span>
          </div>
          <div className="profile-meta-item">
            <Phone size={16} />
            <span>{maskPhone(user.phoneNumber)}</span>
          </div>
        </div>

        {!user.isVerified && (
          <div className="verification-warning">
            <div className="verification-warning-text">
              <AlertTriangle size={20} />
              <span>আপনার অ্যাকাউন্ট যাচাই করা হয়নি। বিজ্ঞাপন দিতে ও চ্যাট করতে যাচাই করুন।</span>
            </div>
            <Link to="/verify" className="btn btn-warning btn-sm">এখনই যাচাই করুন</Link>
          </div>
        )}
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-value">--</div>
          <div className="stat-label">সক্রিয় বিজ্ঞাপন</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">--</div>
          <div className="stat-label">বিক্রিত আইটেম</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.totalReviews}</div>
          <div className="stat-label">মোট রিভিউ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.averageRating.toFixed(1)}</div>
          <div className="stat-label">গড় রেটিং</div>
        </div>
      </div>

      <div className="profile-actions">
        <Link to="/profile/edit" className="btn btn-primary flex-center gap-1">
          <Edit size={18} /> প্রোফাইল সম্পাদনা
        </Link>
        <Link to="/dashboard/my-listings" className="btn btn-outline flex-center gap-1">
          <List size={18} /> আমার বিজ্ঞাপন
        </Link>
        <Link to="/chat" className="btn btn-outline flex-center gap-1">
          <MessageSquare size={18} /> মেসেজ
        </Link>
      </div>

      <div className="recent-reviews">
        <h2 className="section-title">সাম্প্রতিক রিভিউ</h2>
        {reviewsLoading ? (
          <LoadingSpinner />
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.slice(0, 3).map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {reviews.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to={`/user/${user.id}`} className="text-link">সব রিভিউ দেখুন</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>আপনার এখনও কোনো রিভিউ নেই।</p>
          </div>
        )}
      </div>

      <div className="danger-zone">
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>অ্যাকাউন্ট সেটিংস</h3>
        <button 
          className="delete-account-btn"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          অ্যাকাউন্ট ডিলিট করুন
        </button>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="অ্যাকাউন্ট ডিলিট করতে চান?"
        message="আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট ডিলিট করতে চান? এই কাজটিকে আর পূর্বাবস্থায় ফিরিয়ে আনা যাবে না। আইনি বাধ্যবাধকতার কারণে আপনার কিছু ব্যক্তিগত তথ্য (PII) আগামী ৩০ দিন পর্যন্ত আমাদের সিস্টেমে সংরক্ষিত থাকবে।"
        confirmText="ডিলিট করুন"
        confirmVariant="danger"
      />
    </div>
  );
};
