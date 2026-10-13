import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/auth.store';
import { userService } from '@/services/user.service';
import { kycService } from '@/services/kyc.service';
import { listingService } from '@/services/listing.service';
import {
  configureNotifications,
  notifyStatusChange,
  routeForNotification,
  NotificationData,
} from '@/lib/notifications';
import type { Listing } from '@/types/listing.types';

const KEYS = {
  asked: 'bk_notif_permission_asked',
  pushToken: 'bk_push_token',
  kycStatus: 'bk_last_kyc_status',
  listingSnapshot: 'bk_listing_snapshot',
  expiryReminders: 'bk_expiry_reminders',
};

const DAY = 24 * 60 * 60 * 1000;

const getProjectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

const readJson = async <T,>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** A rejected ad = archived + manual moderation flag */
const listingState = (l: Listing) =>
  l.status === 'archived' && l.moderationFlags?.flagType === 'manual' ? 'rejected' : l.status;

/**
 * Push token registration + local notifications from foreground polling (Prompt 36).
 * Mount once inside the logged-in area. Returns state for the pre-permission sheet.
 */
export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const userId = user?.id;
  const [showPrePermission, setShowPrePermission] = useState(false);
  const checking = useRef(false);

  // ─── Push token ────────────────────────────────────────────────────────────
  const registerPushToken = useCallback(async () => {
    if (!Device.isDevice) return; // simulators cannot get a push token
    const projectId = getProjectId();
    if (!projectId) {
      if (__DEV__) console.log('[notifications] No EAS projectId yet — run `eas init` to enable push tokens');
      return;
    }
    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      const saved = await AsyncStorage.getItem(KEYS.pushToken);
      if (token && token !== saved) {
        // The backend field is called fcmToken; it keeps a list of tokens per user
        await userService.updateMe({ fcmToken: token });
        await AsyncStorage.setItem(KEYS.pushToken, token);
      }
    } catch (err) {
      // Expo Go on Android cannot get remote push tokens — a development build is required
      if (__DEV__) console.log('[notifications] push token unavailable:', err);
    }
  }, []);

  /** Called by the pre-permission sheet's "চালু করুন" button */
  const requestPermission = useCallback(async () => {
    setShowPrePermission(false);
    await AsyncStorage.setItem(KEYS.asked, '1');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') await registerPushToken();
  }, [registerPushToken]);

  const dismissPrePermission = useCallback(async () => {
    setShowPrePermission(false);
    await AsyncStorage.setItem(KEYS.asked, '1');
  }, []);

  // ─── Foreground checks (KYC + my ads) ──────────────────────────────────────
  const runChecks = useCallback(async () => {
    const current = useAuthStore.getState().user;
    if (!current || checking.current) return;
    checking.current = true;
    try {
      // KYC result while unverified
      if (!current.isVerified) {
        const log = await kycService.getStatus().catch(() => null);
        const previous = await AsyncStorage.getItem(KEYS.kycStatus);
        const status = log?.verificationStatus ?? 'none';
        if (previous === 'pending_review' && status === 'approved') {
          await refreshUser();
          await notifyStatusChange('kyc', 'success', 'অভিনন্দন! আপনি এখন ভেরিফাইড 🎉', 'এখন বিজ্ঞাপন দিতে ও চ্যাট করতে পারবেন।', { type: 'kyc' });
        } else if (previous === 'pending_review' && status === 'rejected') {
          await notifyStatusChange('kyc', 'error', 'যাচাই বাতিল হয়েছে', log?.manualReviewReason ?? 'আবার আবেদন করুন।', { type: 'kyc' });
        }
        await AsyncStorage.setItem(KEYS.kycStatus, status);
      }

      // My ads: approval / rejection / expiring soon (verified sellers only)
      if (current.isVerified) {
        const page = await listingService.getMyListings(undefined, 1, 50).catch(() => null);
        if (page) {
          const snapshot = await readJson<Record<string, string>>(KEYS.listingSnapshot, {});
          const hadSnapshot = Object.keys(snapshot).length > 0;
          const next: Record<string, string> = {};
          for (const l of page.listings) {
            const state = listingState(l);
            next[l.id] = state;
            const before = snapshot[l.id];
            if (!hadSnapshot || !before || before === state) continue;
            if (before === 'pending' && state === 'active') {
              await notifyStatusChange('listing', 'success', 'আপনার বিজ্ঞাপন অনুমোদিত হয়েছে!', l.title, { type: 'listing', id: l.id });
            } else if (state === 'rejected') {
              await notifyStatusChange('listing', 'error', 'বিজ্ঞাপন বাতিল হয়েছে', l.moderationFlags?.flagReason ?? l.title, { type: 'listing', id: l.id });
            }
          }
          await AsyncStorage.setItem(KEYS.listingSnapshot, JSON.stringify(next));

          // Expiry reminder: once per ad per day when ≤ 3 days are left
          const reminders = await readJson<Record<string, number>>(KEYS.expiryReminders, {});
          const now = Date.now();
          for (const l of page.listings) {
            if (l.status !== 'active' || !l.expiresAt) continue;
            const left = new Date(l.expiresAt).getTime() - now;
            if (left > 0 && left <= 3 * DAY && now - (reminders[l.id] ?? 0) > DAY) {
              reminders[l.id] = now;
              const days = Math.max(1, Math.ceil(left / DAY));
              await notifyStatusChange(
                'listing',
                'info',
                'বিজ্ঞাপনের মেয়াদ শেষ হচ্ছে',
                `"${l.title}" আর ${days} দিন সক্রিয় থাকবে — মেয়াদ বাড়াতে ট্যাপ করুন।`,
                { type: 'listing', id: l.id }
              );
            }
          }
          await AsyncStorage.setItem(KEYS.expiryReminders, JSON.stringify(reminders));
        }
      }
    } finally {
      checking.current = false;
    }
  }, [refreshUser]);

  // ─── Setup after login ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      await configureNotifications();
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        await registerPushToken();
      } else if (status === 'undetermined') {
        const asked = await AsyncStorage.getItem(KEYS.asked);
        // explain first, then ask (a small delay so it doesn't fight the login transition)
        if (!asked && !cancelled) setTimeout(() => !cancelled && setShowPrePermission(true), 1500);
      }
      if (!cancelled) runChecks();
    })();

    // Re-register when the device token changes
    const tokenSub = Notifications.addPushTokenListener(() => {
      AsyncStorage.removeItem(KEYS.pushToken).then(registerPushToken);
    });

    // Notification taps (warm start)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeForNotification(response.notification.request.content.data as Partial<NotificationData>);
    });

    // Cold start from a notification tap
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response && !cancelled) {
          routeForNotification(response.notification.request.content.data as Partial<NotificationData>);
          Notifications.clearLastNotificationResponseAsync().catch(() => {});
        }
      })
      .catch(() => {});

    // Poll on every return to the foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runChecks();
    });

    return () => {
      cancelled = true;
      tokenSub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, [userId, registerPushToken, runChecks]);

  return {
    showPrePermission: showPrePermission && Platform.OS !== 'web',
    requestPermission,
    dismissPrePermission,
  };
}

export default useNotifications;
