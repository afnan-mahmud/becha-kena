import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notification preferences (Prompt 38). Stored locally — the backend has no
 * preference API. `shouldNotify()` is used by lib/notifications.ts.
 */
export type NotificationKind = 'chat' | 'listing' | 'kyc';
/** 'push' = system/local notification with sound, 'inApp' = NotificationBanner */
export type NotificationChannel = 'push' | 'inApp';

export interface NotificationPrefsState {
  chat: boolean;
  listing: boolean;
  kyc: boolean;
  allOff: boolean;
  quietHoursEnabled: boolean;
  /** minutes after midnight */
  quietStart: number;
  quietEnd: number;
  setPref: (key: 'chat' | 'listing' | 'kyc' | 'allOff' | 'quietHoursEnabled', value: boolean) => void;
  setQuietHours: (start: number, end: number) => void;
}

export const useNotificationPrefs = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      chat: true,
      listing: true,
      kyc: true,
      allOff: false,
      quietHoursEnabled: false,
      quietStart: 23 * 60, // ১১:০০ PM
      quietEnd: 7 * 60, // ৭:০০ AM
      setPref: (key, value) => set({ [key]: value } as Partial<NotificationPrefsState>),
      setQuietHours: (quietStart, quietEnd) => set({ quietStart, quietEnd }),
    }),
    {
      name: 'bk_notification_prefs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ setPref, setQuietHours, ...rest }) => rest,
    }
  )
);

/** Is `date` inside the quiet-hours window? Handles windows that cross midnight. */
export function isInQuietHours(
  prefs: Pick<NotificationPrefsState, 'quietHoursEnabled' | 'quietStart' | 'quietEnd'>,
  date = new Date()
): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  const { quietStart: start, quietEnd: end } = prefs;
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

/**
 * Should a notification of `kind` be shown on `channel`?
 * In-app banners are still allowed during quiet hours — only sounds / local pushes are muted.
 */
export function shouldNotify(kind: NotificationKind, channel: NotificationChannel = 'push'): boolean {
  const prefs = useNotificationPrefs.getState();
  if (prefs.allOff) return false;
  if (!prefs[kind]) return false;
  if (channel === 'push' && isInQuietHours(prefs)) return false;
  return true;
}
