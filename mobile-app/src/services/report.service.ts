import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import type { CreateReportBody, Report, ReportsPage } from '@/types/listing.types';

export const reportService = {
  /** POST /reports — targetType is 'Listing' | 'User' (capitalised), description is required */
  createReport: (body: CreateReportBody) =>
    apiClient.post<Report>(ENDPOINTS.REPORTS.BASE, {
      ...body,
      description: body.description.trim(),
    }),

  /** GET /reports/my?page= */
  getMyReports: (page = 1) => apiClient.get<ReportsPage>(ENDPOINTS.REPORTS.MY, { page }),
};

export default reportService;
