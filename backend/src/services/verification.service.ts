import mongoose from 'mongoose';
import VerificationLog from '../models/VerificationLog';
import BannedNid from '../models/BannedNid';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { hashNID } from '../utils/nidHash';

export const submitAdultVerification = async (
  userId: string,
  nidNumber: string,
  dob: Date,
  selfieUrl: string
) => {
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

  // Mock Porichoy API call
  const porichoyResponse = { success: true, name: 'John Doe', timeout: false };
  // Mock AWS Rekognition CompareFaces
  const faceMatchSuccess = true;
  
  let verificationStatus: 'pending_review' | 'approved' | 'rejected' = 'approved';
  let manualReviewReason: string | null = null;
  let verifiedName: string | null = null;

  if (porichoyResponse.timeout || !porichoyResponse.success) {
    manualReviewReason = porichoyResponse.timeout ? 'timeout_fallback' : 'porichoy_error';
    verificationStatus = 'pending_review';
  } else {
    verifiedName = porichoyResponse.name;
    
    if (!faceMatchSuccess) {
      if (attemptsToday >= 3) {
        manualReviewReason = 'face_match_failed_3x';
        verificationStatus = 'pending_review';
      } else {
        verificationStatus = 'rejected';
        manualReviewReason = 'face_match_failed';
      }
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newLog = new VerificationLog({
      userId,
      nidHash,
      dob,
      selfieUrl,
      verificationStatus,
      attemptsToday,
      lastAttemptDate: new Date(),
      manualReviewReason,
    });
    
    await newLog.save({ session });

    if (verificationStatus === 'approved') {
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
    
    if (verificationStatus === 'pending_review' && manualReviewReason === 'timeout_fallback') {
      return 'Sent to manual review';
    }
    
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
) => {
  if (consentConfirmed !== true) {
    throw new AppError('Parental consent is required.', 400, 'CONSENT_REQUIRED');
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

  // Mock Porichoy API call
  const porichoyResponse = { success: true, name: 'Parent Name', timeout: false }; 
  // Mock AWS Rekognition CompareFaces
  const faceMatchSuccess = true;
  
  let verificationStatus: 'pending_review' | 'approved' | 'rejected' = 'approved';
  let manualReviewReason: string | null = null;
  let verifiedName: string | null = null;

  if (porichoyResponse.timeout || !porichoyResponse.success) {
    manualReviewReason = porichoyResponse.timeout ? 'timeout_fallback' : 'porichoy_error';
    verificationStatus = 'pending_review';
  } else {
    verifiedName = porichoyResponse.name;
    
    if (!faceMatchSuccess) {
      if (attemptsToday >= 3) {
        manualReviewReason = 'face_match_failed_3x';
        verificationStatus = 'pending_review';
      } else {
        verificationStatus = 'rejected';
        manualReviewReason = 'face_match_failed';
      }
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newLog = new VerificationLog({
      userId,
      nidHash,
      dob,
      selfieUrl: parentSelfieUrl,
      verificationStatus,
      attemptsToday,
      lastAttemptDate: new Date(),
      manualReviewReason,
    });
    
    await newLog.save({ session });

    if (verificationStatus === 'approved') {
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
    
    if (verificationStatus === 'pending_review' && manualReviewReason === 'timeout_fallback') {
      return 'Sent to manual review';
    }
    
    return verificationStatus;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getVerificationStatus = async (userId: string) => {
  return await VerificationLog.findOne({ userId }).sort({ lastAttemptDate: -1 });
};
