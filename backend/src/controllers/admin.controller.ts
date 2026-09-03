import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

// -- Dashboard Stats --
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, 200, 'Dashboard stats retrieved', stats);
  } catch (error) {
    next(error);
  }
};

// -- User Management --
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await adminService.getUsers(page, limit);
    sendSuccess(res, 200, 'Users retrieved', data);
  } catch (error) {
    next(error);
  }
};

// -- Moderation --
export const getModerationQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await adminService.getModerationQueue(page, limit);
    sendSuccess(res, 200, 'Moderation queue retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const moderateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const moderatorId = req.user?._id as unknown as string;
    const id = req.params.id as string;
    const action = req.body.action as 'approve' | 'reject';
    const reason = req.body.reason as string | undefined;

    if (!['approve', 'reject'].includes(action)) {
      throw new AppError('Action must be approve or reject', 400, 'BAD_REQUEST');
    }
    if (action === 'reject' && !reason) {
      throw new AppError('Reason is required for rejection', 400, 'BAD_REQUEST');
    }

    const listing = await adminService.moderateListing(id, moderatorId, action, reason);
    sendSuccess(res, 200, `Listing ${action}d successfully`, listing);
  } catch (error) {
    next(error);
  }
};

// -- KYC Review --
export const getManualVerificationQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await adminService.getManualVerificationQueue(page, limit);
    sendSuccess(res, 200, 'KYC queue retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const resolveVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const moderatorId = req.user?._id as unknown as string;
    const logId = req.params.logId as string;
    const action = req.body.action as 'approve' | 'reject';

    if (!['approve', 'reject'].includes(action)) {
      throw new AppError('Action must be approve or reject', 400, 'BAD_REQUEST');
    }

    const log = await adminService.resolveVerification(logId, moderatorId, action);
    sendSuccess(res, 200, `Verification ${action}d successfully`, log);
  } catch (error) {
    next(error);
  }
};

export const getPresignedNidUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { selfieUrl } = req.body;
    if (!selfieUrl) {
      throw new AppError('selfieUrl is required', 400, 'BAD_REQUEST');
    }

    const data = await adminService.getPresignedNidUrl(selfieUrl);
    sendSuccess(res, 200, 'Presigned URL generated', data);
  } catch (error) {
    next(error);
  }
};

// -- Ban --
export const banUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?._id as unknown as string;
    const id = req.params.id as string;
    const reason = req.body.reason as string;

    if (!reason) {
      throw new AppError('Reason is required for ban', 400, 'BAD_REQUEST');
    }

    const result = await adminService.banUser(id, adminId, reason);
    sendSuccess(res, 200, result.message, null);
  } catch (error) {
    next(error);
  }
};

// -- Reports --
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const data = await adminService.getReports(status, page, limit);
    sendSuccess(res, 200, 'Reports retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const moderatorId = req.user?._id as unknown as string;
    const id = req.params.id as string;
    const resolution = req.body.resolution as string;

    if (!resolution) {
      throw new AppError('Resolution text is required', 400, 'BAD_REQUEST');
    }

    const report = await adminService.resolveReport(id, moderatorId, resolution);
    sendSuccess(res, 200, 'Report resolved', report);
  } catch (error) {
    next(error);
  }
};

export const dismissReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const moderatorId = req.user?._id as unknown as string;
    const id = req.params.id as string;

    const report = await adminService.dismissReport(id, moderatorId);
    sendSuccess(res, 200, 'Report dismissed', report);
  } catch (error) {
    next(error);
  }
};
