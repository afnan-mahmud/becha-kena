import { Link } from 'react-router-dom';
import type { IReview } from '../../types';
import { RatingStars } from './RatingStars';
import { UserAvatar } from './UserAvatar';
import { formatRelativeTime } from '../../utils/formatters';
import './ReviewCard.css';

export const ReviewCard = ({ review }: { review: IReview }) => {
  const reviewer = typeof review.reviewerId === 'object' ? review.reviewerId : null;
  const listing = typeof review.listingId === 'object' ? review.listingId : null;
  const reviewerName = reviewer?.displayName || 'ক্রেতা';

  return (
    <article className="review-card">
      <div className="review-card-header">
        <UserAvatar name={reviewerName} size="md" />
        <div className="review-card-reviewer-info">
          <h4 className="review-card-reviewer-name">{reviewerName}</h4>
          <div className="review-card-meta">
            <RatingStars rating={review.rating} size="sm" />
            <span className="review-card-date">{formatRelativeTime(review.createdAt)}</span>
          </div>
        </div>
      </div>
      <p className="review-card-text">{review.reviewText}</p>
      {listing && (
        <Link to={`/listings/${listing.id}`} className="review-card-item">কেনা পণ্য: {listing.title}</Link>
      )}
    </article>
  );
};
