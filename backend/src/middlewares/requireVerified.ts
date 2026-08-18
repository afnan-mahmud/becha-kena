import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Access denied. No user found.', 403, 'ACCESS_DENIED'));
  }

  if (!req.user.isVerified) {
    return next(new AppError('You must complete NID verification to perform this action.', 403, 'VERIFICATION_REQUIRED'));
  }

  next();
};
