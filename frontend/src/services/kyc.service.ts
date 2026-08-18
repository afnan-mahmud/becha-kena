import api from '../api/axios';
import type { ApiResponse, IVerificationLog } from '../types';

export const submitAdultVerification = async (data: any): Promise<ApiResponse<IVerificationLog>> => {
  const response = await api.post<ApiResponse<IVerificationLog>>('/kyc/verify-adult', data);
  return response.data;
};

export const submitMinorVerification = async (data: any): Promise<ApiResponse<IVerificationLog>> => {
  const response = await api.post<ApiResponse<IVerificationLog>>('/kyc/verify-minor', data);
  return response.data;
};

export const getVerificationStatus = async (): Promise<ApiResponse<IVerificationLog>> => {
  const response = await api.get<ApiResponse<IVerificationLog>>('/kyc/status');
  return response.data;
};
