import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { getPublicProfile } from '../../services/user.service';
import { getListings } from '../../services/listing.service';
import { getReviewsForUser } from '../../services/review.service';
import { ReviewCard } from '../../components/ui/ReviewCard';
import { ListingCard, ListingCardSkeleton } from '../../components/ui/ListingCard';
import { ReportModal } from '../../components/report/ReportModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SEOHead } from '../../components/common/SEOHead';
import { useAuthStore } from '../../store/authStore';
import { useRequireVerified } from '../../hooks/useAuth';
import { formatNumber } from '../../utils/formatters';
import { ProfileHeader } from './ProfileHeader';
import './MyProfilePage.css';

export const PublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const requireVerified = useRequireVerified();
  const [tab, setTab] = useState<'listings' | 'reviews'>('listings');
  const [reportOpen, setReportOpen] = useState(false);

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['public-user', id],
    queryFn: () => getPublicProfile(id as string),
    enabled: !!id,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['listings', 'seller', id],
    queryFn: () => getListings({ sellerId: id, limit: 24 }),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getReviewsForUser(id as string),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !userData?.data) {
    return (
      <div className="profile container">
        <div className="empty-state"><h2>ব্যবহারকারী পাওয়া যায়নি</h2><p>প্রোফাইলটি মুছে ফেলা হয়েছে বা বিদ্যমান নেই।</p></div>
      </div>
    );
  }

  const user = userData.data;
  const listings = listingsData?.data?.listings || [];
  const reviews = reviewsData?.data?.reviews || [];
  const isMe = me?.id === user.id;

  return (
    <div className="profile container">
      <SEOHead title={`${user.displayName} — বেচা-কেনা`} />
      <ProfileHeader
        name={user.displayName || ''}
        isVerified={user.isVerified}
        verifiedName={user.verifiedName}
        averageRating={user.averageRating}
        totalReviews={user.totalReviews}
        createdAt={user.createdAt}
        actions={!isMe && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => requireVerified(`/user/${user.id}`) && setReportOpen(true)}>
            <Flag size={15} /> রিপোর্ট
          </button>
        )}
      />

      <div className="tabs-row profile-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'listings'} className={`tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
          বিজ্ঞাপন <span className="tab__count">{formatNumber(listingsData?.data?.total ?? 0)}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'reviews'} className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          রিভিউ <span className="tab__count">{formatNumber(user.totalReviews)}</span>
        </button>
      </div>

      {tab === 'listings' ? (
        listingsLoading ? (
          <div className="listings-grid">{Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
        ) : listings.length > 0 ? (
          <div className="listings-grid">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        ) : (
          <div className="empty-state"><p>এই মুহূর্তে কোনো সক্রিয় বিজ্ঞাপন নেই।</p></div>
        )
      ) : reviews.length > 0 ? (
        <div className="reviews-list">{reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
      ) : (
        <div className="empty-state"><p>এখনো কোনো রিভিউ নেই।</p></div>
      )}

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetType="User" targetId={user.id} />
    </div>
  );
};
