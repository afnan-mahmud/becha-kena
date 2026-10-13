import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import type {
  CreateReviewBody,
  Review,
  ReviewerRef,
  ReviewListingRef,
  ReviewsPage,
} from '@/types/listing.types';

export const reviewService = {
  /** GET /reviews/user/:userId?page= */
  getUserReviews: (userId: string, page = 1) =>
    apiClient.get<ReviewsPage>(ENDPOINTS.REVIEWS.BY_USER(userId), { page }),

  /** POST /reviews — only the buyer the ad was sold to can review (one per ad) */
  createReview: (body: CreateReviewBody) =>
    apiClient.post<Review>(ENDPOINTS.REVIEWS.BASE, {
      ...body,
      rating: Math.round(body.rating),
      reviewText: body.reviewText.trim(),
    }),
};

/** Populated helpers — the API populates these on GET /reviews/user/:id */
export const getReviewer = (review: Review): ReviewerRef | null =>
  typeof review.reviewerId === 'object' && review.reviewerId ? review.reviewerId : null;

export const getReviewListing = (review: Review): ReviewListingRef | null =>
  typeof review.listingId === 'object' && review.listingId ? review.listingId : null;

export default reviewService;
