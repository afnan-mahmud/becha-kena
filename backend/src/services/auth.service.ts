import { normalizePhone } from '../utils/phone';
import { generateOTP, hashOTP, compareOTP } from '../utils/otp';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
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

  const isMatch = await compareOTP(otpCode, otpRecord.otpCode);

  if (!isMatch) {
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

  // Delete the used OTP record
  await TemporaryOtp.deleteOne({ _id: otpRecord._id });

  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const logout = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (user) {
    user.tokenVersion += 1;
    await user.save();
  }
};
