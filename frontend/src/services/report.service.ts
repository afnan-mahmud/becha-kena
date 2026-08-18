import api from '../api/axios';
import type { ApiResponse, IReport, PaginatedResponse } from '../types';

export const submitReport = async (data: { targetType: string; targetId: string; reason: string; description: string }): Promise<ApiResponse<IReport>> => {
  const response = await api.post<ApiResponse<IReport>>('/reports', data);
  return response.data;
};

export const getMyReports = async (page?: number): Promise<PaginatedResponse<IReport>> => {
  const response = await api.get<PaginatedResponse<IReport>>('/reports/my', { params: { page } });
  return response.data;
};
