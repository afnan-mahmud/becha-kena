import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth';
import { requireVerified } from '../middlewares/requireVerified';
import { validate } from '../middlewares/validate';
import { submitReviewSchema } from '../validations/review.validation';

const router = Router();

router.post('/', authenticate, requireVerified, validate(submitReviewSchema), reviewController.submitReview);
router.get('/user/:userId', reviewController.getReviewsForUser);

export default router;
