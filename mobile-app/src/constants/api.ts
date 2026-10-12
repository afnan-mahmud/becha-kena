import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API and Socket URLs and Endpoints
 */

const getDevHost = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return 'localhost';
};

const resolveUrl = (envUrl?: string, defaultPort: number = 4000, path: string = ''): string => {
  const url = envUrl || `http://localhost:${defaultPort}${path}`;
  if (Platform.OS !== 'web' && url.includes('localhost')) {
    const devHost = getDevHost();
    if (devHost && devHost !== 'localhost') {
      return url.replace('localhost', devHost);
    }
  }
  return url;
};

export const API_URL = resolveUrl(
  process.env.EXPO_PUBLIC_API_URL,
  4000,
  '/api/v1'
);

export const SOCKET_URL = resolveUrl(
  process.env.EXPO_PUBLIC_SOCKET_URL,
  4000
);

export const ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: '/auth/request-otp',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USER: {
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
  },
  KYC: {
    VERIFY_ADULT: '/kyc/verify-adult',
    VERIFY_MINOR: '/kyc/verify-minor',
    STATUS: '/kyc/status',
  },
  MEDIA: {
    PRESIGNED_URL: '/media/presigned-url',
  },
  LISTINGS: {
    BASE: '/listings',
    MY: '/listings/my',
    BY_ID: (id: string) => `/listings/${id}`,
    SELL: (id: string) => `/listings/${id}/sell`,
    RENEW: (id: string) => `/listings/${id}/renew`,
  },
  CHAT: {
    ROOMS: '/chat/rooms',
    MESSAGES: (roomId: string) => `/chat/rooms/${roomId}/messages`,
  },
  REVIEWS: {
    BASE: '/reviews',
    BY_USER: (userId: string) => `/reviews/user/${userId}`,
  },
  REPORTS: {
    BASE: '/reports',
    MY: '/reports/my',
  },
} as const;
