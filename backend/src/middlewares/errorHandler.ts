import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${new Date().toISOString()}:`, err);

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  // Handle Mongoose specific errors
  if (error.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format', 'INVALID_ID');
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((el: any) => el.message);
    return sendError(res, 400, 'Validation failed', 'VALIDATION_FAILED', details);
  }

  // Handle Mongoose duplicate key error
  if (error.code === 11000) {
    return sendError(res, 409, 'Duplicate entry found', 'DUPLICATE_ENTRY');
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token', 'INVALID_TOKEN');
  }

  if (error.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token has expired', 'TOKEN_EXPIRED');
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  // Handle unhandled errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    return sendError(
      res,
      500,
      err.message,
      'INTERNAL_ERROR',
      err.stack ? [err.stack] : undefined
    );
  }

  return sendError(res, 500, 'Internal Server Error', 'INTERNAL_ERROR');
};
