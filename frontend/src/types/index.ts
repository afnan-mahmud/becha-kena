export interface IUser {
  id: string;
  phoneNumber: string;
  displayName?: string;
  verifiedName?: string;
  isVerified: boolean;
  ageGroup?: 'minor' | 'adult';
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  averageRating: number;
  totalReviews: number;
  lastLoginDate?: Date | string;
  createdAt: Date | string;
}

export interface IListing {
  id: string;
  sellerId: string;
  seller?: Pick<IUser, 'displayName' | 'verifiedName' | 'isVerified' | 'averageRating' | 'totalReviews' | 'phoneNumber'>;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  images: string[];
  hidePhoneNumber: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number];
    addressLine?: string;
    division: string;
    district: string;
    thana: string;
  };
  soldToBuyerId?: string;
  status: 'active' | 'sold' | 'expired' | 'under_review' | 'rejected';
  moderationFlags?: any;
  expiresAt: Date | string;
  createdAt: Date | string;
}

export interface IChatRoom {
  id: string;
  listingId: string;
  listing?: Pick<IListing, 'title' | 'images' | 'price' | 'status'>;
  buyerId: string;
  buyer?: Pick<IUser, 'displayName' | 'isVerified'>;
  sellerId: string;
  seller?: Pick<IUser, 'displayName' | 'isVerified'>;
  lastMessage?: string;
  unreadCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IMessage {
  id: string;
  roomId: string;
  senderId: string;
  messageText: string;
  readStatus: boolean;
  createdAt: Date | string;
}

export interface IReview {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewer?: Pick<IUser, 'displayName'>;
  revieweeId: string;
  rating: number;
  reviewText: string;
  createdAt: Date | string;
}

export interface IReport {
  id: string;
  reporterId: string;
  targetType: 'listing' | 'user' | 'message';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date | string;
}

export interface IVerificationLog {
  id: string;
  userId: string | Pick<IUser, 'displayName' | 'phoneNumber'>;
  verificationType?: 'adult' | 'minor';
  selfiePath?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  manualReviewReason?: string;
  createdAt: Date | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ListingFilters {
  category?: ListingCategory | string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  status?: string;
  sellerId?: string;
}

export const ListingCategory = {
  Mobile: 'Mobile',
  Electronics: 'Electronics',
  Vehicles: 'Vehicles',
  Furniture: 'Furniture',
  Cycles: 'Cycles',
  Fashion: 'Fashion',
  HealthBeauty: 'Health & Beauty',
  FoodRestaurant: 'Food & Restaurant',
  Travel: 'Travel',
  SportsOutdoors: 'Sports & Outdoors',
  Other: 'Other',
} as const;
export type ListingCategory = typeof ListingCategory[keyof typeof ListingCategory];

export const ListingCondition = {
  New: 'New',
  LikeNew: 'Like New',
  Used: 'Used',
} as const;
export type ListingCondition = typeof ListingCondition[keyof typeof ListingCondition];
