import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';
import User, { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;
    
    if (!token) {
      return next(new AppError('Authentication token missing', 401, 'TOKEN_MISSING'));
    }

    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return next(new AppError('Invalid token payload', 401, 'INVALID_TOKEN'));
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return next(new AppError('User not found', 401, 'INVALID_TOKEN'));
    }

    if (user.status === 'suspended') {
      return next(new AppError('Your account has been suspended', 403, 'ACCOUNT_SUSPENDED'));
    }

    // Reactivate user if they were inactive
    if (user.status === 'inactive') {
      user.status = 'active';
      user.lastLoginDate = new Date();
      await user.save();
    }

    // Token version check to ensure token hasn't been revoked
    if (payload.tokenVersion !== user.tokenVersion) {
      return next(new AppError('Token has been revoked', 401, 'TOKEN_EXPIRED'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;
  
  if (!token) {
    return next();
  }

  // If token is found, validate it just like authenticate
  return authenticate(req, res, next);
};
