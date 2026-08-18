import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/review.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user is guaranteed to exist because of the authenticate middleware
    const reviewerId = req.user?._id as unknown as string;
    const { listingId, rating, reviewText } = req.body;

    if (!listingId || !rating || !reviewText) {
      throw new AppError('listingId, rating, and reviewText are required.', 400, 'BAD_REQUEST');
    }

    const review = await reviewService.submitReview(
      reviewerId,
      listingId,
      Number(rating),
      reviewText
    );

    sendSuccess(res, 201, 'Review submitted successfully', review);
  } catch (error) {
    next(error);
  }
};

export const getReviewsForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await reviewService.getReviewsForUser(userId, page, limit);

    sendSuccess(res, 200, 'Reviews retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
