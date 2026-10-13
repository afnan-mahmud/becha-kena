import { ApiError } from '@/types/api.types';

/**
 * Turns any thrown value into a user-facing Bangla message.
 * Keyed by status / code (Prompt 46). For 409s and validation errors the
 * API message is more specific, so it is shown as-is.
 */
export function getErrorMessage(err: unknown, fallback = 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন'): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR') return 'ইন্টারনেট সংযোগ পরীক্ষা করুন';
    if (err.code === 'SESSION_EXPIRED' || err.status === 401) return 'আবার লগইন করুন';
    if (err.code === 'VERIFICATION_REQUIRED') return 'এই কাজের জন্য NID দিয়ে যাচাই প্রয়োজন';
    if (err.code === 'ACCOUNT_SUSPENDED') return 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে';
    if (err.status === 429) return 'অনেকবার চেষ্টা করেছেন, কিছুক্ষণ পর আবার চেষ্টা করুন';
    if (err.status >= 500) return 'সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন';
    if (err.status === 404 && (err.code === 'NOT_FOUND' || err.code === 'ROUTE_NOT_FOUND')) {
      return 'খুঁজে পাওয়া যায়নি';
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Returns the machine code of an ApiError (or undefined). */
export function getErrorCode(err: unknown): string | undefined {
  return err instanceof ApiError ? err.code : undefined;
}

/** Joins validation `details` (if any) under the main message. */
export function getErrorDetails(err: unknown): string | undefined {
  if (err instanceof ApiError && err.details?.length) return err.details.join('\n');
  return undefined;
}
