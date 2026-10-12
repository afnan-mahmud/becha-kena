import mongoose from 'mongoose';
import { Report } from '../models/Report';
import User from '../models/User';
import Listing from '../models/Listing';
import { stripHtmlTags } from '../utils/sanitize';
import { AppError } from '../utils/AppError';

export const submitReport = async (
  reporterId: string,
  targetType: 'Listing' | 'User',
  targetId: string,
  reason: string,
  description: string
) => {
  if (!mongoose.isValidObjectId(targetId)) {
    throw new AppError('Report target not found', 404, 'NOT_FOUND');
  }

  // One open report per reporter + target is enough
  const duplicate = await Report.exists({ reporterId, targetType, targetId, status: 'pending' });
  if (duplicate) {
    throw new AppError('You have already reported this. Our team is reviewing it.', 409, 'DUPLICATE_REPORT');
  }

  // Validate the target exists
  if (targetType === 'User') {
    const user = await User.findById(targetId);
    if (!user) {
      throw new AppError('Target user not found', 404, 'NOT_FOUND');
    }
    // Prevent self-reporting
    if (String(reporterId) === String(targetId)) {
      throw new AppError('You cannot report yourself.', 400, 'BAD_REQUEST');
    }
  } else if (targetType === 'Listing') {
    const listing = await Listing.findById(targetId);
    if (!listing) {
      throw new AppError('Target listing not found', 404, 'NOT_FOUND');
    }
    if (String(listing.sellerId) === String(reporterId)) {
      throw new AppError('You cannot report your own listing.', 400, 'BAD_REQUEST');
    }
  } else {
    throw new AppError('Invalid targetType. Must be Listing or User.', 400, 'BAD_REQUEST');
  }

  // Sanitize description
  const sanitizedDescription = stripHtmlTags(description);

  // Create Report document
  const report = new Report({
    reporterId,
    targetType,
    targetId,
    reason,
    description: sanitizedDescription,
  });

  await report.save();

  return report;
};

export const getMyReports = async (reporterId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const reports = await Report.find({ reporterId })
    // For polymorphic references, mongoose refPath handles population conditionally
    // But selecting both title (Listing) and displayName (User) ensures either is available
    .populate('targetId', 'title displayName') 
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments({ reporterId });
  const totalPages = Math.ceil(total / limit);

  return { reports, total, page, totalPages };
};
