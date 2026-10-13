import { useUiStore, InAppNotification } from '@/store/ui.store';

/**
 * Small helpers around the in-app NotificationBanner queue (ui.store).
 * Usable from anywhere — components, services, stores.
 */
type ToastOptions = Pick<InAppNotification, 'body' | 'onPress'>;

const push = (type: InAppNotification['type'], title: string, options?: ToastOptions) =>
  useUiStore.getState().showNotification({ type, title, ...options });

export const toast = {
  success: (title: string, options?: ToastOptions) => push('success', title, options),
  error: (title: string, options?: ToastOptions) => push('error', title, options),
  warning: (title: string, options?: ToastOptions) => push('warning', title, options),
  info: (title: string, options?: ToastOptions) => push('info', title, options),
  chat: (senderName: string, preview: string, onPress?: () => void) =>
    useUiStore.getState().showNotification({
      type: 'chat',
      title: senderName,
      body: preview,
      avatarName: senderName,
      onPress,
    }),
};

export default toast;
