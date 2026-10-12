// User and KYC types

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive';
export type AgeGroup = 'adult' | 'minor' | null;

export interface User {
  id: string;
  _id?: string;
  phoneNumber: string;
  displayName: string;
  verifiedName: string | null;
  isVerified: boolean;
  ageGroup: AgeGroup;
  role: UserRole;
  status: UserStatus;
  averageRating: number;
  totalReviews: number;
  lastLoginDate?: string;
  deletionRequestedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Optional client/legacy helpers
  kycStatus?: KycStatus;
  kycType?: 'adult' | 'minor';
  rejectionReason?: string;
  rating?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
