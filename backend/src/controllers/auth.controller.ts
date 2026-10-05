import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/AppError';

export const requestOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return next(new AppError('phoneNumber is required', 400, 'BAD_REQUEST'));
    }

    const result = await authService.requestOTP(phoneNumber);

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'OTP sent successfully',
      data: result, // { expiresIn: 180 }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
      return next(new AppError('phoneNumber and otpCode are required', 400, 'BAD_REQUEST'));
    }

    const { accessToken, refreshToken, user } = await authService.verifyOTP(phoneNumber, otpCode);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth/refresh',
    });

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Verified successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401, 'UNAUTHORIZED'));
    }

    await authService.logout((req.user._id as any).toString());

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return next(new AppError('Refresh token missing', 401, 'TOKEN_MISSING'));
    }

    const { accessToken } = await authService.refreshToken(token);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      status: 'success',
      success: true,
      message: 'Token refreshed',
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
};
