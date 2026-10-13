// Listing, review and report types — must match backend/src/models (see API Contract)
import type { SellerSummary } from './user.types';

export type { SellerSummary } from './user.types';

export type ListingCondition = 'new' | 'like_new' | 'used';
/** Short alias used across the app */
export type Condition = ListingCondition;
export type ListingStatus = 'pending' | 'active' | 'sold' | 'archived';
export type ListingSort = 'newest' | 'oldest' | 'price_low' | 'price_high';

export interface ListingLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  addressLine?: string;
  division?: string;
  district?: string;
  thana?: string;
}

export interface ModerationFlags {
  flagType: 'keyword' | 'image' | 'report' | 'manual' | null;
  flagReason: string | null;
}

export interface Listing {
  id: string;
  sellerId: string | SellerSummary; // object on public endpoints, string on /listings/my
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  images: string[];
  hidePhoneNumber: boolean;
  location: ListingLocation;
  soldToBuyerId: string | null;
  status: ListingStatus;
  moderationFlags?: ModerationFlags;
  distance?: number; // meters, only for lat/lng searches
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /listings and GET /listings/my */
export interface ListingsPage {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
/** @deprecated use ListingsPage */
export type ListingsResponse = ListingsPage;

export interface GetListingsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  division?: string;
  district?: string;
  thana?: string;
  sellerId?: string;
  sort?: ListingSort;
  lat?: number;
  lng?: number;
  radius?: number; // meters
}

export interface CreateListingBody {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  images: string[];
  hidePhoneNumber?: boolean;
  location: {
    coordinates: [number, number]; // [lng, lat]
    division?: string;
    district?: string;
    thana?: string;
    addressLine?: string;
  };
}

export type UpdateListingBody = Partial<CreateListingBody>;

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface ReviewListingRef {
  id: string;
  title: string;
  images: string[];
  price: number;
}

export interface ReviewerRef {
  id: string;
  displayName: string;
  isVerified: boolean;
}

export interface Review {
  id: string;
  listingId: ReviewListingRef | string;
  reviewerId: ReviewerRef | string;
  revieweeId: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface ReviewsPage {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number;
}

export interface CreateReviewBody {
  listingId: string;
  rating: number; // integer 1-5
  reviewText: string; // required, ≤ 500
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportTargetType = 'Listing' | 'User';
export type ReportReason = 'scam' | 'harassment' | 'misrepresentation' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: { id: string; title?: string; displayName?: string } | null;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
}

export interface ReportsPage {
  reports: Report[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateReportBody {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string; // required, 1-1000
}
