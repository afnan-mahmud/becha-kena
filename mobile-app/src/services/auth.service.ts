import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import type { AuthPayload } from '@/types/api.types';

export const authService = {
  /** POST /auth/request-otp → { expiresIn: 180 } */
  requestOtp: (phoneNumber: string) =>
    apiClient.post<{ expiresIn: number }>(ENDPOINTS.AUTH.REQUEST_OTP, { phoneNumber }),

  /** POST /auth/verify-otp — otpCode must be a STRING */
  verifyOtp: (phoneNumber: string, otpCode: string) =>
    apiClient.post<AuthPayload>(ENDPOINTS.AUTH.VERIFY_OTP, { phoneNumber, otpCode: String(otpCode) }),

  /** POST /auth/logout — invalidates every token of the user */
  logout: () => apiClient.post<unknown>(ENDPOINTS.AUTH.LOGOUT),
};

export default authService;
