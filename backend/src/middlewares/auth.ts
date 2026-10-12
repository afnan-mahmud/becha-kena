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

/**
 * Reads the access token from the httpOnly cookie (web) or the
 * `Authorization: Bearer <token>` header (mobile app).
 */
export const extractAccessToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim() || undefined;
  }
  return req.cookies?.accessToken;
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractAccessToken(req);
    
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

    // Token version check to ensure token hasn't been revoked
    if (payload.tokenVersion !== user.tokenVersion) {
      return next(new AppError('Token has been revoked', 401, 'TOKEN_EXPIRED'));
    }

    // Reactivate user if they were inactive (logging back in also cancels a pending deletion)
    if (user.status === 'inactive') {
      user.status = 'active';
      user.deletionRequestedAt = null;
      user.lastLoginDate = new Date();
      await user.save();
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
  const token = extractAccessToken(req);

  if (!token) {
    return next();
  }

  // A stale/invalid token on a public route should not block the request —
  // treat the visitor as a guest instead.
  return authenticate(req, res, (err?: any) => {
    if (err) {
      req.user = undefined;
    }
    next();
  });
};
