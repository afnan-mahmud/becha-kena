import mongoose from 'mongoose';
import Listing from '../models/Listing';
import VerificationLog from '../models/VerificationLog';
import User from '../models/User';
import BannedNid from '../models/BannedNid';
import { Report } from '../models/Report';
import { generatePresignedReadUrl } from './s3.service';
import { AppError } from '../utils/AppError';

// -- Dashboard Stats --

export const getDashboardStats = async () => {
  const [pendingListings, pendingKYC, pendingReports, activeUsers, activeListings] = await Promise.all([
    Listing.countDocuments({ status: 'pending' }),
    VerificationLog.countDocuments({ verificationStatus: 'pending_review' }),
    Report.countDocuments({ status: 'pending' }),
    User.countDocuments({ status: 'active' }),
    Listing.countDocuments({ status: 'active' }),
  ]);

  return { pendingListings, pendingKYC, pendingReports, activeUsers, activeListings };
};

// -- User Management --

export const getUsers = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-tokenVersion -fcmTokens -parentNIDHash -__v') // Exclude sensitive info
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();
  const totalPages = Math.ceil(total / limit);

  return { items: users, total, page, totalPages };
};

// -- Moderation Queue --

export const getModerationQueue = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const listings = await Listing.find({ status: 'pending' })
    .populate('sellerId', 'displayName isVerified')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Listing.countDocuments({ status: 'pending' });
  const totalPages = Math.ceil(total / limit);

  return { items: listings, total, page, totalPages };
};

export const moderateListing = async (
  listingId: string,
  moderatorId: string,
  action: 'approve' | 'reject',
  reason?: string
) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  if (action === 'approve') {
    listing.status = 'active';
    listing.moderationFlags = {
      flagType: null,
      flagReason: null,
      reviewedBy: new mongoose.Types.ObjectId(moderatorId),
    };
  } else if (action === 'reject') {
    listing.status = 'archived';
    listing.moderationFlags = {
      flagType: 'manual',
      flagReason: reason || 'Rejected by moderator',
      reviewedBy: new mongoose.Types.ObjectId(moderatorId),
    };
  }

  await listing.save();
  // TODO: Send notification to seller (NT-2)

  return listing;
};

// -- Manual KYC Review Queue --

export const getManualVerificationQueue = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const logs = await VerificationLog.find({ verificationStatus: 'pending_review' })
    .select('-nidHash')
    .populate('userId', 'displayName phoneNumber')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const total = await VerificationLog.countDocuments({ verificationStatus: 'pending_review' });
  const totalPages = Math.ceil(total / limit);

  return { items: logs, total, page, totalPages };
};

export const resolveVerification = async (
  logId: string,
  moderatorId: string,
  action: 'approve' | 'reject',
  options: { verifiedName?: string; reason?: string } = {}
) => {
  const log = await VerificationLog.findById(logId);
  if (!log) {
    throw new AppError('Verification log not found', 404, 'NOT_FOUND');
  }

  if (log.verificationStatus !== 'pending_review') {
    throw new AppError('This verification request has already been resolved', 400, 'ALREADY_RESOLVED');
  }

  const user = await User.findById(log.userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (action === 'approve') {
      log.verificationStatus = 'approved';
      log.verifiedBy = new mongoose.Types.ObjectId(moderatorId);
      
      log.manualReviewReason = null;

      // The moderator types the legal name exactly as printed on the NID
      // (a Porichoy API integration would fill this automatically).
      const update: Record<string, any> = {
        isVerified: true,
        verifiedName: options.verifiedName?.trim() || user.displayName,
        ageGroup: log.verificationType === 'minor' ? 'minor' : 'adult',
      };

      if (log.verificationType === 'minor') {
        const minorTransitionDueDate = new Date(log.dob);
        minorTransitionDueDate.setFullYear(minorTransitionDueDate.getFullYear() + 18);
        minorTransitionDueDate.setDate(minorTransitionDueDate.getDate() + 30);
        update.parentNIDHash = log.nidHash;
        update.minorTransitionDueDate = minorTransitionDueDate;
      }

      await User.findByIdAndUpdate(log.userId, update, { session });
    } else if (action === 'reject') {
      log.verificationStatus = 'rejected';
      log.verifiedBy = new mongoose.Types.ObjectId(moderatorId);
      log.manualReviewReason = options.reason?.trim() || 'The submitted information could not be verified';
    }

    await log.save({ session });
    await session.commitTransaction();
    // TODO: Send notification to user (NT-1)
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return log;
};

export const getPresignedNidUrl = async (selfieUrl: string) => {
  // Extract S3 object key from URL if it's a full URL
  let key = selfieUrl;
  if (key.startsWith('http')) {
    const urlParts = key.split('/');
    key = urlParts.slice(3).join('/');
  }
  const url = await generatePresignedReadUrl(key);
  return { url };
};

// -- User Ban --

export const banUser = async (userId: string, adminId: string, reason: string) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    user.status = 'suspended';
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ session });

    await Listing.updateMany(
      { sellerId: userId, status: 'active' },
      { $set: { status: 'archived' } },
      { session }
    );

    const latestApprovedLog = await VerificationLog.findOne({
      userId: userId,
      verificationStatus: 'approved'
    }).sort({ createdAt: -1 }).session(session);

    if (latestApprovedLog && latestApprovedLog.nidHash) {
      const existingBan = await BannedNid.findOne({ nidHash: latestApprovedLog.nidHash }).session(session);
      if (!existingBan) {
        const bannedNid = new BannedNid({
          nidHash: latestApprovedLog.nidHash,
          reason,
          bannedBy: new mongoose.Types.ObjectId(adminId)
        });
        await bannedNid.save({ session });
      }
    }

    await session.commitTransaction();
    return { message: 'User banned successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// -- Reports Management --

export const getReports = async (status?: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const filter: any = {};
  if (status) {
    filter.status = status;
  }

  const reports = await Report.find(filter)
    .populate('reporterId', 'displayName')
    .populate('targetId', 'title displayName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Report.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return { items: reports, total, page, totalPages };
};

export const resolveReport = async (reportId: string, moderatorId: string, resolution: string) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError('Report not found', 404, 'NOT_FOUND');
  }

  report.status = 'resolved';
  report.reviewedBy = new mongoose.Types.ObjectId(moderatorId);
  report.resolution = resolution;

  await report.save();
  return report;
};

export const dismissReport = async (reportId: string, moderatorId: string) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError('Report not found', 404, 'NOT_FOUND');
  }

  report.status = 'dismissed';
  report.reviewedBy = new mongoose.Types.ObjectId(moderatorId);

  await report.save();
  return report;
};
