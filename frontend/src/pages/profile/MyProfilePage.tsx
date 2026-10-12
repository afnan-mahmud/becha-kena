import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, List, MessageCircle, Flag, Phone, ShieldCheck, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { getReviewsForUser } from '../../services/review.service';
import { getMyListings } from '../../services/listing.service';
import { deleteAccount } from '../../services/user.service';
import { ReviewCard } from '../../components/ui/ReviewCard';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SEOHead } from '../../components/common/SEOHead';
import { formatNumber, getErrorMessage, maskPhone } from '../../utils/formatters';
import { ProfileHeader } from './ProfileHeader';
import './MyProfilePage.css';

export const MyProfilePage = () => {
  const { user, clearUser } = useAuthStore();
  const logout = useLogout();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', user?.id],
    queryFn: () => getReviewsForUser(user!.id),
    enabled: !!user?.id,
  });

  const { data: activeData } = useQuery({ queryKey: ['my-listings', 'active', 'count'], queryFn: () => getMyListings('active', 1, 1), enabled: !!user });
  const { data: soldData } = useQuery({ queryKey: ['my-listings', 'sold', 'count'], queryFn: () => getMyListings('sold', 1, 1), enabled: !!user });

  if (!user) return <LoadingSpinner fullScreen />;

  const reviews = reviewsData?.data?.reviews || [];

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      clearUser();
      toast.success('অ্যাকাউন্ট মুছে ফেলার অনুরোধ নেওয়া হয়েছে। ৩০ দিনের মধ্যে লগইন করলে অনুরোধ বাতিল হবে।', { duration: 6000 });
      window.location.href = '/';
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="profile container">
      <SEOHead title="আমার প্রোফাইল — বেচা-কেনা" />

      <ProfileHeader
        name={user.displayName || ''}
        isVerified={user.isVerified}
        verifiedName={user.verifiedName}
        averageRating={user.averageRating}
        totalReviews={user.totalReviews}
        createdAt={user.createdAt}
        extra={<span><Phone size={15} /> {maskPhone(user.phoneNumber)}</span>}
        actions={<Link to="/profile/edit" className="btn btn-outline btn-sm"><Pencil size={15} /> এডিট</Link>}
      />

      {!user.isVerified && (
        <div className="profile-alert">
          <ShieldCheck size={22} />
          <span>আপনার অ্যাকাউন্ট এখনো যাচাই হয়নি। বিজ্ঞাপন দিতে ও চ্যাট করতে NID দিয়ে যাচাই করুন।</span>
          <Link to="/verify" className="btn btn-secondary btn-sm">এখনই যাচাই করুন</Link>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-tile"><strong>{formatNumber(activeData?.data?.total ?? 0)}</strong><span>সক্রিয় বিজ্ঞাপন</span></div>
        <div className="stat-tile"><strong>{formatNumber(soldData?.data?.total ?? 0)}</strong><span>বিক্রিত</span></div>
        <div className="stat-tile"><strong>{formatNumber(user.totalReviews)}</strong><span>রিভিউ</span></div>
        <div className="stat-tile"><strong>{user.averageRating.toFixed(1)}</strong><span>গড় রেটিং</span></div>
      </div>

      <div className="quick-links">
        <Link to="/dashboard/my-listings" className="quick-link"><span className="quick-link__icon"><List size={18} /></span> আমার বিজ্ঞাপন</Link>
        <Link to="/listings/create" className="quick-link"><span className="quick-link__icon"><Plus size={18} /></span> নতুন বিজ্ঞাপন</Link>
        {user.isVerified && <Link to="/chat" className="quick-link"><span className="quick-link__icon"><MessageCircle size={18} /></span> মেসেজ</Link>}
        <Link to="/profile/reports" className="quick-link"><span className="quick-link__icon"><Flag size={18} /></span> আমার রিপোর্ট</Link>
      </div>

      <section>
        <div className="section-head">
          <h2>আমার পাওয়া রিভিউ</h2>
          {reviews.length > 0 && <Link to={`/user/${user.id}`} className="section-link">পাবলিক প্রোফাইল দেখুন</Link>}
        </div>
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.slice(0, 4).map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        ) : (
          <div className="empty-state"><p>এখনো কোনো রিভিউ নেই। পণ্য বিক্রির পর ক্রেতা রিভিউ দিতে পারবেন।</p></div>
        )}
      </section>

      <section className="danger-zone">
        <div>
          <h3>অ্যাকাউন্ট</h3>
          <p>লগআউট করুন অথবা অ্যাকাউন্ট মুছে ফেলার অনুরোধ করুন।</p>
        </div>
        <div className="danger-zone__actions">
          <button type="button" className="btn btn-outline" onClick={logout}>লগআউট</button>
          <button type="button" className="btn btn-danger-outline" onClick={() => setIsDeleteOpen(true)}>অ্যাকাউন্ট মুছুন</button>
        </div>
      </section>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="অ্যাকাউন্ট মুছে ফেলবেন?"
        message="আপনার সব বিজ্ঞাপন সাথে সাথে লুকিয়ে যাবে এবং ৩০ দিন পর ব্যক্তিগত তথ্য স্থায়ীভাবে মুছে যাবে। এর মধ্যে আবার লগইন করলে অনুরোধটি বাতিল হবে।"
        confirmText="হ্যাঁ, মুছে ফেলুন"
        confirmVariant="danger"
      />
    </div>
  );
};
