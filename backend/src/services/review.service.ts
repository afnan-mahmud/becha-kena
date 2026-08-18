import mongoose from 'mongoose';
import { Review } from '../models/Review';
import Listing from '../models/Listing';
import ChatRoom from '../models/ChatRoom';
import User from '../models/User';
import { AppError } from '../utils/AppError';

export const submitReview = async (
  reviewerId: string,
  listingId: string,
  rating: number,
  reviewText: string
) => {
  // Step 1: Find the listing
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }
  if (listing.status !== 'sold') {
    throw new AppError('Listing must be marked as sold before reviewing.', 400, 'BAD_REQUEST');
  }

  // Step 2: Verify the reviewer is the soldToBuyerId on the listing
  if (String(listing.soldToBuyerId) !== String(reviewerId)) {
    throw new AppError('Only the buyer can review this listing.', 403, 'ACCESS_DENIED');
  }

  const revieweeId = listing.sellerId;

  // Step 3: Verify a ChatRoom exists between reviewer (buyer) and seller for this listing
  const chatRoom = await ChatRoom.findOne({
    listingId,
    buyerId: reviewerId,
    sellerId: revieweeId,
  });

  if (!chatRoom) {
    throw new AppError('No chat history found.', 400, 'NO_CHAT_HISTORY');
  }

  // Step 4: Check if a review already exists for this listing
  const existingReview = await Review.findOne({ listingId });
  if (existingReview) {
    throw new AppError('A review already exists for this listing.', 409, 'DUPLICATE_ENTRY');
  }

  // Step 5: Transaction
  const session = await mongoose.startSession();
  let createdReview;

  try {
    session.startTransaction();

    // Create the Review document
    createdReview = new Review({
      listingId,
      reviewerId,
      revieweeId,
      rating,
      reviewText,
    });
    await createdReview.save({ session });

    // Recalculate the seller's averageRating and totalReviews
    const stats = await Review.aggregate([
      { $match: { revieweeId: new mongoose.Types.ObjectId(String(revieweeId)) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    let avgRating = 0;
    let total = 0;
    if (stats.length > 0) {
      avgRating = Number(stats[0].averageRating.toFixed(1));
      total = stats[0].totalReviews;
    }

    // Update the seller's User document
    await User.findByIdAndUpdate(
      revieweeId,
      { averageRating: avgRating, totalReviews: total },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return createdReview;
};

export const getReviewsForUser = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ revieweeId: userId })
    .populate('reviewerId', 'displayName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ revieweeId: userId });
  
  const user = await User.findById(userId).select('averageRating');
  const averageRating = user ? user.averageRating : 0;

  return { reviews, total, averageRating };
};
