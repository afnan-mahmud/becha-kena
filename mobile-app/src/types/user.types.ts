// User + KYC types — must match backend/src/models/User.ts and VerificationLog.ts

export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive';
export type AgeGroup = 'adult' | 'minor' | null;

export interface User {
  id: string;
  phoneNumber: string; // "+8801712345678"
  displayName: string; // nickname, 1-30 chars
  verifiedName: string | null; // legal name, set by admin on KYC approval
  isVerified: boolean;
  ageGroup: AgeGroup;
  role: UserRole;
  status: UserStatus;
  averageRating: number;
  totalReviews: number;
  lastLoginDate: string;
  deletionRequestedAt: string | null;
  createdAt: string;
}

/** GET /users/:id */
export type PublicUser = Pick<
  User,
  'id' | 'displayName' | 'verifiedName' | 'isVerified' | 'averageRating' | 'totalReviews' | 'createdAt'
>;

/** Populated `listing.sellerId` on public listing endpoints */
export interface SellerSummary extends PublicUser {
  /** null unless the viewer is verified AND the ad does not hide the number */
  phoneNumber?: string | null;
}

export type VerificationType = 'adult' | 'minor';
export type VerificationStatus = 'pending_review' | 'approved' | 'rejected';

/** GET /kyc/status → data.status */
export interface VerificationLog {
  id: string;
  verificationType: VerificationType;
  verificationStatus: VerificationStatus;
  manualReviewReason: string | null;
  selfieUrl: string;
  createdAt: string;
}

/** @deprecated use AuthPayload from api.types */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
