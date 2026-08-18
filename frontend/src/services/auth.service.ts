import api from '../api/axios';
import type { ApiResponse, IUser } from '../types';

export const requestOTP = async (phoneNumber: string): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/auth/request-otp', { phoneNumber });
  return response.data;
};

export const verifyOTP = async (phoneNumber: string, otpCode: string): Promise<ApiResponse<{ user: IUser; accessToken: string }>> => {
  const response = await api.post<ApiResponse<{ user: IUser; accessToken: string }>>('/auth/verify-otp', { phoneNumber, otpCode });
  return response.data;
};

export const logout = async (): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/auth/logout');
  return response.data;
};
