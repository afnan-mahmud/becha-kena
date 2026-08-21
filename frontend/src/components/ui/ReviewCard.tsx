import type { IReview } from '../../types';
import { RatingStars } from './RatingStars';
import { UserAvatar } from './UserAvatar';
import { formatRelativeTime } from '../../utils/formatters';
import './ReviewCard.css';

interface ReviewCardProps {
  review: IReview;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const reviewerName = review.reviewer?.displayName || 'অজ্ঞাত ব্যবহারকারী';
  
  return (
    <div className="review-card">
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
    </div>
  );
};
