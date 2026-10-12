import mongoose from 'mongoose';
import VerificationLog from '../models/VerificationLog';
import BannedNid from '../models/BannedNid';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { hashNID } from '../utils/nidHash';

type SubmissionResult = 'pending_review' | 'approved' | 'rejected';

const NID_REGEX = /^(\d{10}|\d{13}|\d{17})$/;

const ageInYears = (dob: Date) => {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

const assertCanSubmit = async (userId: string, nidNumber: string, dob: Date, selfieUrl: string) => {
  if (!NID_REGEX.test(String(nidNumber))) {
    throw new AppError('NID number must be 10, 13 or 17 digits.', 400, 'INVALID_NID');
  }
  if (Number.isNaN(dob.getTime()) || dob > new Date()) {
    throw new AppError('Please provide a valid date of birth.', 400, 'INVALID_DOB');
  }
  if (typeof selfieUrl !== 'string' || !/^https?:\/\//.test(selfieUrl)) {
    throw new AppError('A valid selfie image URL is required.', 400, 'INVALID_SELFIE');
  }

  const user = await User.findById(userId).select('isVerified');
  if (user?.isVerified) {
    throw new AppError('Your account is already verified.', 409, 'ALREADY_VERIFIED');
  }

  const pending = await VerificationLog.exists({ userId, verificationStatus: 'pending_review' });
  if (pending) {
    throw new AppError('You already have a verification request under review.', 409, 'KYC_PENDING');
  }
};

export const submitAdultVerification = async (
  userId: string,
  nidNumber: string,
  dob: Date,
  selfieUrl: string
): Promise<SubmissionResult> => {
  await assertCanSubmit(userId, nidNumber, dob, selfieUrl);
  if (ageInYears(dob) < 18) {
    throw new AppError('You are under 18. Please use the minor (guardian) verification.', 400, 'UNDERAGE');
  }

  const nidHash = hashNID(nidNumber);

  const isBanned = await BannedNid.findOne({ nidHash });
  if (isBanned) {
    throw new AppError('This NID has been permanently banned.', 403, 'NID_BANNED');
  }

  let lastLog = await VerificationLog.findOne({ userId }).sort({ lastAttemptDate: -1 });

  let attemptsToday = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lastLog) {
    const lastAttemptDate = new Date(lastLog.lastAttemptDate);
    lastAttemptDate.setHours(0, 0, 0, 0);

    if (lastAttemptDate.getTime() === today.getTime()) {
      attemptsToday = lastLog.attemptsToday;
      if (attemptsToday >= 3) {
        throw new AppError('Maximum verification attempts reached for today.', 429, 'KYC_LIMIT_REACHED');
      }
    }
  }

  attemptsToday += 1;

  let verificationStatus: 'pending_review' | 'approved' | 'rejected' = 'pending_review';
  let manualReviewReason: string | null = 'Manual verification required';
  let verifiedName: string | null = null;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newLog = new VerificationLog({
      userId,
      verificationType: 'adult',
      nidHash,
      dob,
      selfieUrl,
      verificationStatus,
      attemptsToday,
      lastAttemptDate: new Date(),
      manualReviewReason,
    });
    
    await newLog.save({ session });

    if ((verificationStatus as string) === 'approved') {
      await User.findByIdAndUpdate(
        userId,
        {
          isVerified: true,
          verifiedName: verifiedName,
          ageGroup: 'adult',
        },
        { session }
      );
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return verificationStatus;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const submitMinorVerification = async (
  userId: string,
  parentNidNumber: string,
  dob: Date,
  parentSelfieUrl: string,
  consentConfirmed: boolean
): Promise<SubmissionResult> => {
  if (consentConfirmed !== true) {
    throw new AppError('Parental consent is required.', 400, 'CONSENT_REQUIRED');
  }

  await assertCanSubmit(userId, parentNidNumber, dob, parentSelfieUrl);
  if (ageInYears(dob) >= 18) {
    throw new AppError('You are 18 or older. Please use the adult verification.', 400, 'NOT_A_MINOR');
  }

  const nidHash = hashNID(parentNidNumber);

  const isBanned = await BannedNid.findOne({ nidHash });
  if (isBanned) {
    throw new AppError('This NID has been permanently banned.', 403, 'NID_BANNED');
  }

  const minorCount = await User.countDocuments({ parentNIDHash: nidHash });
  if (minorCount >= 3) {
    throw new AppError('Maximum 3 minor accounts per parent NID.', 403, 'PARENT_NID_LIMIT');
  }

  let lastLog = await VerificationLog.findOne({ userId }).sort({ lastAttemptDate: -1 });

  let attemptsToday = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lastLog) {
    const lastAttemptDate = new Date(lastLog.lastAttemptDate);
    lastAttemptDate.setHours(0, 0, 0, 0);

    if (lastAttemptDate.getTime() === today.getTime()) {
      attemptsToday = lastLog.attemptsToday;
      if (attemptsToday >= 3) {
        throw new AppError('Maximum verification attempts reached for today.', 429, 'KYC_LIMIT_REACHED');
      }
    }
  }

  attemptsToday += 1;

  let verificationStatus: 'pending_review' | 'approved' | 'rejected' = 'pending_review';
  let manualReviewReason: string | null = 'Manual verification required';
  let verifiedName: string | null = null;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newLog = new VerificationLog({
      userId,
      verificationType: 'minor',
      nidHash,
      dob,
      selfieUrl: parentSelfieUrl,
      verificationStatus,
      attemptsToday,
      lastAttemptDate: new Date(),
      manualReviewReason,
    });
    
    await newLog.save({ session });

    if ((verificationStatus as string) === 'approved') {
      const minorTransitionDueDate = new Date(dob);
      minorTransitionDueDate.setFullYear(minorTransitionDueDate.getFullYear() + 18);
      minorTransitionDueDate.setDate(minorTransitionDueDate.getDate() + 30);

      await User.findByIdAndUpdate(
        userId,
        {
          isVerified: true,
          ageGroup: 'minor',
          parentNIDHash: nidHash,
          minorTransitionDueDate,
        },
        { session }
      );
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return verificationStatus;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getVerificationStatus = async (userId: string) => {
  // nidHash is never sent back to the client
  return await VerificationLog.findOne({ userId }).sort({ lastAttemptDate: -1 }).select('-nidHash');
};
