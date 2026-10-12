// Auth Service (To be implemented in Prompt 4)
export const authService = {
  requestOtp: async (phoneNumber: string) => {
    // POST /auth/request-otp
    return { phoneNumber };
  },
  verifyOtp: async (phoneNumber: string, otpCode: string) => {
    // POST /auth/verify-otp
    return { phoneNumber, otpCode };
  },
  refreshToken: async (token: string) => {
    // POST /auth/refresh
    return { token };
  },
  logout: async () => {
    // POST /auth/logout
  },
};
