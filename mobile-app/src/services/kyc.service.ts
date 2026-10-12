import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'not_submitted';

export interface VerificationLog {
  id: string;
  userId: string;
  type: 'adult' | 'minor';
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

// Submit payloads
export interface AdultKycPayload {
  nidNumber: string;
  dob: string;           // ISO date string e.g. "1995-06-15"
  selfieUrl: string;
}

export interface MinorKycPayload {
  parentNidNumber: string;
  dob: string;           // ISO date string e.g. "2010-03-22"
  parentSelfieUrl: string;
  consentConfirmed: true; // always true — enforced by caller
}

// Submit response shape from API: { verificationStatus: "pending_review" }
interface SubmitKycResponse {
  verificationStatus: VerificationStatus;
}

// GET /kyc/status response shape: { status: VerificationLog | null }
interface KycStatusResponse {
  status: VerificationLog | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const kycService = {
  /**
   * Submit adult KYC verification.
   * POST /kyc/verify-adult
   * Returns true when the server acknowledges with verificationStatus === "pending_review".
   */
  submitAdult: async (payload: AdultKycPayload): Promise<boolean> => {
    const data = await apiClient.post<SubmitKycResponse>(
      ENDPOINTS.KYC.VERIFY_ADULT,
      payload
    );
    return data.verificationStatus === 'pending_review';
  },

  /**
   * Submit minor KYC verification.
   * POST /kyc/verify-minor
   * Returns true when the server acknowledges with verificationStatus === "pending_review".
   */
  submitMinor: async (payload: MinorKycPayload): Promise<boolean> => {
    const data = await apiClient.post<SubmitKycResponse>(
      ENDPOINTS.KYC.VERIFY_MINOR,
      { ...payload, consentConfirmed: true }
    );
    return data.verificationStatus === 'pending_review';
  },

  /**
   * Get current KYC verification status.
   * GET /kyc/status
   * Returns VerificationLog or null if no submission exists.
   */
  getStatus: async (): Promise<VerificationLog | null> => {
    const data = await apiClient.get<KycStatusResponse>(ENDPOINTS.KYC.STATUS);
    return data.status ?? null;
  },
};
