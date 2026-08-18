import api from '../api/axios';
import type { ApiResponse, IListing, IReport, IVerificationLog, PaginatedResponse } from '../types';

export const getModerationQueue = async (page?: number): Promise<PaginatedResponse<IListing>> => {
  const response = await api.get<PaginatedResponse<IListing>>('/admin/moderation/listings', { params: { page } });
  return response.data;
};

export const moderateListing = async (id: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse<IListing>> => {
  const response = await api.patch<ApiResponse<IListing>>(`/admin/moderation/listings/${id}`, { action, reason });
  return response.data;
};

export const getKYCQueue = async (page?: number): Promise<PaginatedResponse<IVerificationLog>> => {
  const response = await api.get<PaginatedResponse<IVerificationLog>>('/admin/kyc/queue', { params: { page } });
  return response.data;
};

export const resolveVerification = async (logId: string, action: 'approve' | 'reject'): Promise<ApiResponse<IVerificationLog>> => {
  const response = await api.patch<ApiResponse<IVerificationLog>>(`/admin/kyc/${logId}`, { action });
  return response.data;
};

export const banUser = async (userId: string, reason: string): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(`/admin/users/${userId}/ban`, { reason });
  return response.data;
};

export const getReports = async (status?: string, page?: number): Promise<PaginatedResponse<IReport>> => {
  const response = await api.get<PaginatedResponse<IReport>>('/admin/reports', { params: { status, page } });
  return response.data;
};

export const resolveReport = async (reportId: string, resolution: string): Promise<ApiResponse<IReport>> => {
  const response = await api.patch<ApiResponse<IReport>>(`/admin/reports/${reportId}/resolve`, { resolution });
  return response.data;
};

export const dismissReport = async (reportId: string): Promise<ApiResponse<IReport>> => {
  const response = await api.patch<ApiResponse<IReport>>(`/admin/reports/${reportId}/dismiss`);
  return response.data;
};
