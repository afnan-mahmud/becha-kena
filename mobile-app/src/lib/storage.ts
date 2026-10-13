import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User } from '@/types/user.types';

const ACCESS_TOKEN_KEY = 'bk_access_token';
const REFRESH_TOKEN_KEY = 'bk_refresh_token';
const USER_KEY = 'bk_cached_user';
const ONBOARDED_KEY = 'bk_has_onboarded';
const RECENT_SEARCHES_KEY = 'bk_recent_searches';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// SecureStore helper with graceful fallback for Web environments
const isSecureStoreAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  return await SecureStore.isAvailableAsync();
};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

const getSecureItem = async (key: string): Promise<string | null> => {
  const available = await isSecureStoreAvailable();
  if (available) {
    return await SecureStore.getItemAsync(key);
  }
  return await AsyncStorage.getItem(key);
};

const deleteSecureItem = async (key: string): Promise<void> => {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

/**
 * Save access and refresh tokens to SecureStore
 */
export const saveTokens = async ({
  accessToken,
  refreshToken,
}: Tokens): Promise<void> => {
  await Promise.all([
    setSecureItem(ACCESS_TOKEN_KEY, accessToken),
    setSecureItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
};

/**
 * Get access token from SecureStore
 */
export const getAccessToken = async (): Promise<string | null> => {
  return await getSecureItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from SecureStore
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return await getSecureItem(REFRESH_TOKEN_KEY);
};

/**
 * Clear authentication tokens from SecureStore
 */
export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    deleteSecureItem(ACCESS_TOKEN_KEY),
    deleteSecureItem(REFRESH_TOKEN_KEY),
  ]);
};

/**
 * Cache user data in AsyncStorage for instant UI rendering
 */
export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Retrieve cached user data from AsyncStorage
 */
export const getUser = async <T = User>(): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Clear cached user
 */
export const clearUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

/**
 * Onboarding flag helpers
 */
export const setOnboarded = async (hasOnboarded: boolean = true): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDED_KEY, JSON.stringify(hasOnboarded));
};

export const getOnboarded = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDED_KEY);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return false;
  }
};

/**
 * Recent searches helpers
 */
export const getRecentSearches = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRecentSearches = async (searches: string[]): Promise<void> => {
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
};

/**
 * Per-account data kept in AsyncStorage (notification snapshots, push token…).
 * Removed on logout / account deletion so the next account starts clean.
 */
const SESSION_KEYS = [
  USER_KEY,
  'bk_push_token',
  'bk_last_kyc_status',
  'bk_listing_snapshot',
  'bk_expiry_reminders',
  'bk_reviewed_listings',
];

export const clearSessionData = async (): Promise<void> => {
  await AsyncStorage.multiRemove(SESSION_KEYS);
};

/**
 * Clear all storage (both secure tokens and async-storage data)
 */
export const clearAll = async (): Promise<void> => {
  await clearTokens();
  await AsyncStorage.multiRemove([...SESSION_KEYS, RECENT_SEARCHES_KEY]);
};

export const storage = {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  saveUser,
  getUser,
  clearUser,
  setOnboarded,
  getOnboarded,
  getRecentSearches,
  saveRecentSearches,
  clearSessionData,
  clearAll,
};
