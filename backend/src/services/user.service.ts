import mongoose from 'mongoose';
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

  if (updates.displayName) {
    let cleanName = updates.displayName.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML/JS tags
    if (cleanName.length < 1 || cleanName.length > 30) {
      throw new AppError('Display name must be between 1 and 30 characters', 400, 'BAD_REQUEST');
    }
    user.displayName = cleanName;
  }

  if (updates.fcmToken) {
    if (!user.fcmTokens.includes(updates.fcmToken)) {
      user.fcmTokens.push(updates.fcmToken);
    }
  }

  await user.save();
  return user;
};

export const requestDeletion = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  user.deletionRequestedAt = new Date();
  user.status = 'inactive';
  await user.save();

  try {
    // Attempt to archive listings if Listing model exists
    if (mongoose.models.Listing) {
      await mongoose.models.Listing.updateMany(
        { seller: userId, status: 'active' },
        { status: 'archived' }
      );
    }
  } catch (error) {
    console.error('Failed to archive listings:', error);
  }

  return { message: 'Account deletion requested successfully' };
};

export const getPublicProfile = async (userId: string) => {
  const user = await User.findById(userId).select(
    'displayName verifiedName isVerified averageRating totalReviews createdAt'
  );
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
};
