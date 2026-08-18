import { Request, Response, NextFunction } from 'express';
import * as verificationService from '../services/verification.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

export const submitAdultVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nidNumber, dob, selfieUrl } = req.body;

    if (!nidNumber || !dob || !selfieUrl) {
      return next(new AppError('Please provide nidNumber, dob, and selfieUrl', 400, 'MISSING_FIELDS'));
    }

    const verificationStatus = await verificationService.submitAdultVerification(
      req.user!._id.toString(),
      nidNumber,
      new Date(dob),
      selfieUrl
    );

    sendSuccess(res, 200, 'Adult verification submitted successfully', { verificationStatus });
  } catch (error) {
    next(error);
  }
};

export const submitMinorVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { parentNidNumber, dob, parentSelfieUrl, consentConfirmed } = req.body;

    if (!parentNidNumber || !dob || !parentSelfieUrl || consentConfirmed === undefined) {
      return next(new AppError('Please provide parentNidNumber, dob, parentSelfieUrl, and consentConfirmed', 400, 'MISSING_FIELDS'));
    }

    const verificationStatus = await verificationService.submitMinorVerification(
      req.user!._id.toString(),
      parentNidNumber,
      new Date(dob),
      parentSelfieUrl,
      consentConfirmed
    );

    sendSuccess(res, 200, 'Minor verification submitted successfully', { verificationStatus });
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = await verificationService.getVerificationStatus(req.user!._id.toString());
    
    sendSuccess(res, 200, 'Verification status retrieved successfully', { status });
  } catch (error) {
    next(error);
  }
};
