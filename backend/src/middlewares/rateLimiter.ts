import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError';

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per `window` (here, per hour)
  handler: (req, res, next) => {
    next(new AppError('Too many OTP requests. Try again later.', 429, 'RATE_LIMIT_EXCEEDED'));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
