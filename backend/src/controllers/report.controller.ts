import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

export const submitReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reporterId = req.user?._id as unknown as string;
    const targetType = req.body.targetType as 'Listing' | 'User';
    const targetId = req.body.targetId as string;
    const reason = req.body.reason as string;
    const description = req.body.description as string;

    if (!targetType || !targetId || !reason || !description) {
      throw new AppError('targetType, targetId, reason, and description are required.', 400, 'BAD_REQUEST');
    }

    const report = await reportService.submitReport(
      reporterId as string,
      targetType,
      targetId,
      reason,
      description
    );

    sendSuccess(res, 201, 'Report submitted successfully', report);
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reporterId = req.user?._id as unknown as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await reportService.getMyReports(reporterId as string, page, limit);

    sendSuccess(res, 200, 'Reports retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
