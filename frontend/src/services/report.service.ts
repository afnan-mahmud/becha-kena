import api from '../api/axios';
import type { ApiResponse, IReport, ReportReason, ReportsPage } from '../types';

export const submitReport = async (data: {
  targetType: 'Listing' | 'User';
  targetId: string;
  reason: ReportReason;
  description: string;
}): Promise<ApiResponse<IReport>> => {
  const response = await api.post<ApiResponse<IReport>>('/reports', data);
  return response.data;
};

export const getMyReports = async (page = 1): Promise<ApiResponse<ReportsPage>> => {
  const response = await api.get<ApiResponse<ReportsPage>>('/reports/my', { params: { page } });
  return response.data;
};
