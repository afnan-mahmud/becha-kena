import api from '../api/axios';
import type { ApiResponse, IVerificationLog } from '../types';

type SubmissionResult = ApiResponse<{ verificationStatus: 'pending_review' | 'approved' | 'rejected' }>;

export const submitAdultVerification = async (data: { nidNumber: string; dob: string; selfieUrl: string }): Promise<SubmissionResult> => {
  const response = await api.post<SubmissionResult>('/kyc/verify-adult', data);
  return response.data;
};

export const submitMinorVerification = async (data: {
  parentNidNumber: string;
  dob: string;
  parentSelfieUrl: string;
  consentConfirmed: boolean;
}): Promise<SubmissionResult> => {
  const response = await api.post<SubmissionResult>('/kyc/verify-minor', data);
  return response.data;
};

/** `data.status` is null when the user never applied */
export const getVerificationStatus = async (): Promise<ApiResponse<{ status: IVerificationLog | null }>> => {
  const response = await api.get<ApiResponse<{ status: IVerificationLog | null }>>('/kyc/status');
  return response.data;
};
