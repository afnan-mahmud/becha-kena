import { normalizePhone } from '../utils/phone';
import { generateOTP, hashOTP, compareOTP } from '../utils/otp';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import TemporaryOtp from '../models/TemporaryOtp';
import User from '../models/User';

export const requestOTP = async (phoneNumber: string): Promise<{ expiresIn: number }> => {
  const normalizedPhone = normalizePhone(phoneNumber);
  const otpCode = generateOTP();
  
  const hashedOtp = await hashOTP(otpCode);
  
  await TemporaryOtp.create({
    phoneNumber: normalizedPhone,
    otpCode: hashedOtp,
  });

  // TODO: Send OTP via SMS gateway
  console.log(`[SMS Gateway Mock] Sending OTP ${otpCode} to ${normalizedPhone}`);

  return { expiresIn: 180 };
};

export const verifyOTP = async (phoneNumber: string, otpCode: string) => {
  const normalizedPhone = normalizePhone(phoneNumber);

  // Find the latest OTP record for this phone number
  const otpRecord = await TemporaryOtp.findOne({ phoneNumber: normalizedPhone }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new AppError('Invalid or expired OTP', 401, 'INVALID_OTP');
  }

  // MongoDB's TTL sweep runs about once a minute, so check expiry explicitly
  if (otpRecord.expiresAt.getTime() < Date.now()) {
    await TemporaryOtp.deleteOne({ _id: otpRecord._id });
    throw new AppError('OTP has expired. Please request a new one.', 401, 'OTP_EXPIRED');
  }

  // Brute-force protection: an OTP is burned after 5 wrong guesses
  if (otpRecord.attempts >= 5) {
    await TemporaryOtp.deleteOne({ _id: otpRecord._id });
    throw new AppError('Too many wrong attempts. Please request a new OTP.', 429, 'OTP_ATTEMPTS_EXCEEDED');
  }

  const isMatch = await compareOTP(otpCode, otpRecord.otpCode);

  if (!isMatch) {
    await TemporaryOtp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
    throw new AppError('Invalid or expired OTP', 401, 'INVALID_OTP');
  }

  // Find or create the User (upsert by phoneNumber)
  let user = await User.findOne({ phoneNumber: normalizedPhone });

  if (!user) {
    const last4 = normalizedPhone.slice(-4);
    user = await User.create({
      phoneNumber: normalizedPhone,
      displayName: `User${last4}`,
    });
  }

  // Check user status
  if (user.status === 'suspended') {
    throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
  }

  // Logging in reactivates an inactive account and cancels a pending deletion request
  if (user.status === 'inactive') {
    user.status = 'active';
    user.deletionRequestedAt = null;
  }

  // Update lastLoginDate
  user.lastLoginDate = new Date();
  await user.save();

  // Generate tokens
  const payload = {
    userId: (user._id as any).toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({
    userId: (user._id as any).toString(),
    tokenVersion: user.tokenVersion,
  });

  // Delete all OTP records for this phone once one is used
  await TemporaryOtp.deleteMany({ phoneNumber: normalizedPhone });

  const { tokenVersion: _tokenVersion, fcmTokens: _fcmTokens, ...safeUser } = user.toJSON() as any;

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
};

export const logout = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (user) {
    user.tokenVersion += 1;
    await user.save();
  }
};

export const refreshToken = async (token: string) => {
  let payload: any;
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.userId);

  if (!user || user.status === 'suspended') {
    throw new AppError('User not found or suspended', 401, 'INVALID_TOKEN');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new AppError('Token has been revoked', 401, 'TOKEN_EXPIRED');
  }

  const accessToken = generateAccessToken({
    userId: (user._id as any).toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  return { accessToken };
};
