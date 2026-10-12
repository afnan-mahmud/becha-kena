// Listing and category types

export type ListingCondition = 'new' | 'like_new' | 'used';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'rejected';

export interface Location {
  division: string;
  district?: string;
  thana?: string;
  coordinates?: [number, number]; // [lng, lat]
}

export interface ListingSeller {
  id: string;
  displayName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isVerified: boolean;
  rating?: number;
  totalReviews?: number;
}

export interface Listing {
  id: string;
  _id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  images: string[];
  location: Location;
  sellerId: string | ListingSeller;
  status: ListingStatus;
  viewsCount?: number;
  isNegotiable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilterParams {
  category?: string;
  division?: string;
  district?: string;
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}
