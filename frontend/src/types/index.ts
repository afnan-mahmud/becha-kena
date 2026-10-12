// Shapes mirror the backend responses. Every document carries both `id` and `_id`.

export interface IUser {
  id: string;
  _id?: string;
  phoneNumber: string;
  displayName?: string;
  verifiedName?: string | null;
  isVerified: boolean;
  ageGroup?: 'minor' | 'adult' | null;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'inactive' | 'banned';
  averageRating: number;
  totalReviews: number;
  lastLoginDate?: Date | string;
  createdAt: Date | string;
}

/** Public seller info populated into `listing.sellerId` */
export interface ISellerSummary {
  id: string;
  _id?: string;
  displayName?: string;
  verifiedName?: string | null;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt?: Date | string;
  /** Only present on listing detail, and null when hidden / viewer not verified */
  phoneNumber?: string | null;
}

export type ListingStatus = 'pending' | 'active' | 'archived' | 'sold';
export type ListingConditionValue = 'new' | 'like_new' | 'used';

export interface IListingLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  addressLine?: string;
  division?: string;
  district?: string;
  thana?: string;
}

export interface IListing {
  id: string;
  _id?: string;
  /** A plain id on "my listings", a populated seller object on public endpoints */
  sellerId: string | ISellerSummary;
  title: string;
  description: string;
  price: number;
  category: string;
  condition?: ListingConditionValue;
  images: string[];
  hidePhoneNumber: boolean;
  location: IListingLocation;
  soldToBuyerId?: string | null;
  status: ListingStatus;
  moderationFlags?: {
    flagType?: 'keyword' | 'image' | 'report' | 'manual' | null;
    flagReason?: string | null;
  };
  distance?: number;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface IUserPreview {
  id: string;
  displayName?: string;
  verifiedName?: string | null;
  isVerified: boolean;
}

export interface IMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender?: IUserPreview | null;
  messageText: string;
  readStatus: boolean;
  createdAt: Date | string;
}

export interface IChatRoom {
  id: string;
  listingId: string;
  listing: (Pick<IListing, 'id' | 'title' | 'images' | 'price' | 'status'> & { soldToBuyerId?: string | null; sellerId?: string }) | null;
  buyerId: string;
  buyer: IUserPreview | null;
  sellerId: string;
  seller: IUserPreview | null;
  lastMessage: IMessage | null;
  unreadCount: number;
  latestActivity?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IReview {
  id: string;
  listingId: string | Pick<IListing, 'id' | 'title' | 'images' | 'price'>;
  reviewerId: string | IUserPreview;
  revieweeId: string;
  rating: number;
  reviewText: string;
  createdAt: Date | string;
}

export type ReportReason = 'scam' | 'harassment' | 'misrepresentation' | 'inappropriate' | 'other';

export interface IReport {
  id: string;
  reporterId: string | Pick<IUser, 'id' | 'displayName'>;
  targetType: 'Listing' | 'User';
  targetId: string | { id: string; title?: string; displayName?: string };
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolution?: string | null;
  createdAt: Date | string;
}

export interface IVerificationLog {
  id: string;
  userId: string | Pick<IUser, 'id' | 'displayName' | 'phoneNumber'>;
  verificationType?: 'adult' | 'minor';
  selfieUrl?: string;
  verificationStatus: 'pending_review' | 'approved' | 'rejected';
  manualReviewReason?: string | null;
  createdAt: Date | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

/** Admin list endpoints */
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ListingsPage {
  listings: IListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessagesPage {
  messages: IMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReviewsPage {
  reviews: IReview[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number;
}

export interface ReportsPage {
  reports: IReport[];
  total: number;
  page: number;
  totalPages: number;
}

export type ListingSort = 'newest' | 'oldest' | 'price_low' | 'price_high';

export interface ListingFilters {
  category?: string;
  condition?: ListingConditionValue;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  division?: string;
  district?: string;
  thana?: string;
  sellerId?: string;
  sort?: ListingSort;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}
