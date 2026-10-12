import mongoose from 'mongoose';
import Listing from '../models/Listing';
import User from '../models/User';
import { AppError } from '../utils/AppError';

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-tokenVersion -fcmTokens');
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
};

export const updateProfile = async (
  userId: string,
  updates: { displayName?: string; fcmToken?: string }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (updates.displayName !== undefined) {
    if (typeof updates.displayName !== 'string') {
      throw new AppError('displayName must be a string', 400, 'BAD_REQUEST');
    }
    const cleanName = updates.displayName.replace(/<\/?[^>]+(>|$)/g, "").trim(); // Strip HTML/JS tags
    if (cleanName.length < 1 || cleanName.length > 30) {
      throw new AppError('Display name must be between 1 and 30 characters', 400, 'BAD_REQUEST');
    }
    user.displayName = cleanName;
  }

  if (updates.fcmToken && typeof updates.fcmToken === 'string') {
    if (!user.fcmTokens.includes(updates.fcmToken)) {
      user.fcmTokens.push(updates.fcmToken);
    }
  }

  await user.save();
  return getProfile(userId);
};

export const requestDeletion = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  user.deletionRequestedAt = new Date();
  user.status = 'inactive';
  // Revoke every issued token so the current session cannot silently reactivate the account
  user.tokenVersion += 1;
  user.fcmTokens = [];
  await user.save();

  await Listing.updateMany(
    { sellerId: user._id, status: { $in: ['active', 'pending'] } },
    { $set: { status: 'archived' } }
  );

  return { message: 'Account deletion requested successfully' };
};

export const getPublicProfile = async (userId: string) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  const user = await User.findById(userId).select(
    'displayName verifiedName isVerified averageRating totalReviews createdAt'
  );
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
};
