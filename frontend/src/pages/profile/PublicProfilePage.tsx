import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';

import { getPublicProfile } from '../../services/user.service';
import { getListings } from '../../services/listing.service';
import { getReviewsForUser } from '../../services/review.service';
import { formatDate } from '../../utils/formatters';

import { UserAvatar } from '../../components/ui/UserAvatar';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { RatingStars } from '../../components/ui/RatingStars';
import { ReviewCard } from '../../components/ui/ReviewCard';
import { ListingCard } from '../../components/ui/ListingCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// Reuse MyProfilePage.css for the layout
import './MyProfilePage.css';

export const PublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['public-user', id],
    queryFn: () => getPublicProfile(id as string),
    enabled: !!id
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['user-listings', id],
    queryFn: () => getListings({ sellerId: id, status: 'active' }),
    enabled: !!id
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['user-reviews', id],
    queryFn: () => getReviewsForUser(id as string),
    enabled: !!id
  });

  if (userLoading) return <LoadingSpinner fullScreen />;
  
  if (userError || !userData?.data) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>ব্যবহারকারী পাওয়া যায়নি</h2>
        <p>আপনি যে প্রোফাইলটি খুঁজছেন তা মুছে ফেলা হয়েছে বা বিদ্যমান নেই।</p>
      </div>
    );
  }

  const user = userData.data;
  const listings = listingsData?.data?.items || [];
  const reviews = reviewsData?.data?.items || [];

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
        </div>
      </div>

      <div className="user-active-listings" style={{ marginBottom: '3rem' }}>
        <h2 className="section-title">সক্রিয় বিজ্ঞাপন ({listings.length})</h2>
        {listingsLoading ? (
          <LoadingSpinner />
        ) : listings.length > 0 ? (
          <div className="listings-grid">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>এই মুহূর্তে কোনো সক্রিয় বিজ্ঞাপন নেই।</p>
          </div>
        )}
      </div>

      <div className="recent-reviews">
        <h2 className="section-title">রিভিউ ({user.totalReviews})</h2>
        {reviewsLoading ? (
          <LoadingSpinner />
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>এখনও কোনো রিভিউ নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
};
