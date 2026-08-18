import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  error: string,
  code: string,
  details?: any[]
) => {
  res.status(statusCode).json({
    success: false,
    error,
    code,
    ...(details !== undefined && { details }),
  });
};
