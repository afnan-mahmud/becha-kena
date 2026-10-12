// Listing and category types per API Contract

export type Condition = 'new' | 'like_new' | 'used';
export type ListingCondition = Condition; // Alias for backward compatibility
export type ListingStatus = 'pending' | 'active' | 'sold' | 'archived';

export interface SellerSummary {
  id: string;
  displayName: string;
  verifiedName: string | null;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  phoneNumber?: string | null;
}

export type ListingSeller = SellerSummary; // Alias

export interface ListingLocation {
  type?: 'Point';
  coordinates?: [number, number]; // [lng, lat]
  division?: string;
  district?: string;
  thana?: string;
  addressLine?: string;
}

export interface Listing {
  id: string;
  _id?: string;
  sellerId: string | SellerSummary; // populated object on public endpoints, plain id on /listings/my
  title: string;
  description: string;
  price: number;
  category: string;
  condition: Condition;
  images: string[];
  hidePhoneNumber: boolean;
  location: ListingLocation;
  status: ListingStatus;
  soldToBuyerId: string | null;
  moderationFlags?: {
    flagType: 'keyword' | 'image' | 'report' | 'manual' | null;
    flagReason: string | null;
  };
  distance?: number; // meters, only for lat/lng searches
  viewsCount?: number;
  isNegotiable?: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetListingsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  division?: string;
  district?: string;
  thana?: string;
  sellerId?: string;
  sort?: 'newest' | 'oldest' | 'price_low' | 'price_high';
  lat?: number;
  lng?: number;
  radius?: number; // meters
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateListingBody {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: Condition;
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
