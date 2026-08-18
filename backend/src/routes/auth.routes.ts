import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { otpRateLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';
import { requestOtpSchema, verifyOtpSchema } from '../validations/auth.validation';

const router = Router();

router.post('/request-otp', otpRateLimiter, validate(requestOtpSchema), authController.requestOTP);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/logout', authenticate, authController.logout);

export default router;
