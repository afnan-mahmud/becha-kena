import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { toast } from '@/lib/toast';
import { NotificationKind, shouldNotify } from '@/store/notificationPrefs.store';
import type { Message } from '@/types/chat.types';

/**
 * Local + in-app notification helpers (Prompt 36/37).
 * The backend stores push tokens but does NOT send pushes yet, so alerts are
 * generated on the device from socket events and foreground polling.
 */

export type NotificationData =
  | { type: 'chat'; roomId: string }
  | { type: 'kyc' }
  | { type: 'listing'; id?: string };

let handlerConfigured = false;

/** Show local notifications as banners (with sound) even while the app is open */
export async function configureNotifications() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'বেচা-কেনা',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#00704A',
      vibrationPattern: [0, 200, 120, 200],
    }).catch(() => {});
  }
}

const hasPermission = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

/** Schedules an immediate local notification if prefs + permission allow it. Returns true if shown. */
export async function presentLocalNotification(
  kind: NotificationKind,
  title: string,
  body: string,
  data: NotificationData
): Promise<boolean> {
  if (!shouldNotify(kind, 'push') || !(await hasPermission())) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data as unknown as Record<string, unknown>, sound: 'default' },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

/** Opens the screen that belongs to a notification's data */
export function routeForNotification(data: Partial<NotificationData> | undefined) {
  if (!data?.type) return;
  switch (data.type) {
    case 'chat':
      if ('roomId' in data && data.roomId) router.push(`/(app)/chat/${data.roomId}`);
      break;
    case 'kyc':
      router.push('/(app)/kyc/status');
      break;
    case 'listing':
      router.push('/(app)/my-listings');
      break;
  }
}

/**
 * Status update (KYC result, ad approved / rejected / expiring):
 * system notification when allowed, otherwise the in-app banner.
 */
export async function notifyStatusChange(
  kind: Exclude<NotificationKind, 'chat'>,
  variant: 'success' | 'warning' | 'error' | 'info',
  title: string,
  body: string,
  data: NotificationData
) {
  const shown = await presentLocalNotification(kind, title, body, data);
  if (!shown && shouldNotify(kind, 'inApp')) {
    toast[variant](title, { body, onPress: () => routeForNotification(data) });
  }
}

/**
 * A chat message from the other person arrived over the socket.
 * - app open, conversation not open → in-app banner (tap opens the chat)
 * - app in background / inactive → local notification
 */
export function notifyIncomingMessage(message: Message) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require breaks an import cycle
  const { useChatStore } = require('@/store/chat.store');
  const activeRoomId: string | null = useChatStore.getState().activeRoomId;
  const senderName = message.sender?.displayName ?? 'নতুন মেসেজ';
  const appActive = AppState.currentState === 'active';

  if (appActive) {
    if (activeRoomId === message.roomId) return;
    if (!shouldNotify('chat', 'inApp')) return;
    toast.chat(senderName, message.messageText, () => router.push(`/(app)/chat/${message.roomId}`));
    return;
  }

  presentLocalNotification('chat', senderName, message.messageText, {
    type: 'chat',
    roomId: message.roomId,
  }).catch(() => {});
}
