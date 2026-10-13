import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Radius, Shadows, useTheme } from '@/constants/theme';
import { InAppNotification, InAppNotificationType, useUiStore } from '@/store/ui.store';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';

const AUTO_DISMISS_MS = 4000;
const HIDDEN_Y = -160;

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * In-app notification banner (Prompt 37). Mounted once in the root layout and
 * driven by the queue in ui.store — call `toast.*` / `showNotification()`.
 * Shows one at a time, slides down, auto-dismisses after 4s, swipe up to dismiss.
 */
export function NotificationBanner() {
  const current = useUiStore((s) => s.notificationQueue[0]);
  const dismiss = useUiStore((s) => s.dismissNotification);

  if (!current) return null;
  // key → a fresh component (and fresh animation) for every notification
  return <BannerItem key={current.id} notification={current} onHidden={dismiss} />;
}

function BannerItem({
  notification,
  onHidden,
}: {
  notification: InAppNotification;
  onHidden: (id: string) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(HIDDEN_Y);
  const opacity = useSharedValue(0);
  // Shared value instead of a ref: it is read from the gesture callback too
  const hiding = useSharedValue(false);

  const finish = useCallback(() => onHidden(notification.id), [notification.id, onHidden]);

  const hide = useCallback(() => {
    if (hiding.get()) return;
    hiding.set(true);
    opacity.set(withTiming(0, { duration: 180 }));
    translateY.set(
      withTiming(HIDDEN_Y, { duration: reduceMotion ? 1 : 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(finish);
      })
    );
  }, [finish, hiding, opacity, reduceMotion, translateY]);

  // Slide in, then auto-dismiss after 4s
  useEffect(() => {
    opacity.set(withTiming(1, { duration: 200 }));
    translateY.set(reduceMotion ? 0 : withSpring(0, { damping: 18, stiffness: 200 }));
    const timer = setTimeout(hide, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [hide, opacity, reduceMotion, translateY]);

  const swipeUp = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      translateY.set(Math.min(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY < -30 || e.velocityY < -500) {
        scheduleOnRN(hide);
      } else {
        translateY.set(withSpring(0));
      }
    });

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const variant = getVariant(notification.type, colors);

  const handlePress = () => {
    notification.onPress?.();
    hide();
  };

  return (
    <View style={[styles.wrapper, { top: insets.top + 6 }]} pointerEvents="box-none">
      <GestureDetector gesture={swipeUp}>
        <Animated.View style={[styles.banner, Shadows.lg, { backgroundColor: variant.bg, borderColor: variant.border }, style]}>
          <Pressable onPress={handlePress} style={styles.pressable} accessibilityRole="alert">
            {notification.type === 'chat' ? (
              <Avatar name={notification.avatarName ?? notification.title} size={38} />
            ) : (
              <View style={[styles.iconCircle, { backgroundColor: variant.iconBg }]}>
                <Ionicons name={variant.icon} size={20} color={variant.fg} />
              </View>
            )}
            <View style={styles.texts}>
              <AppText variant="bodySmall" numberOfLines={1} style={[styles.title, { color: variant.title }]}>
                {notification.title}
              </AppText>
              {notification.body ? (
                <AppText variant="caption" numberOfLines={2} style={{ color: variant.body }}>
                  {notification.body}
                </AppText>
              ) : null}
            </View>
            <Pressable onPress={hide} hitSlop={10} accessibilityLabel="বন্ধ করুন">
              <Ionicons name="close" size={18} color={variant.body} />
            </Pressable>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function getVariant(type: InAppNotificationType, colors: ReturnType<typeof useTheme>['colors']) {
  const base = { border: 'transparent', title: '#FFFFFF', body: 'rgba(255,255,255,0.9)', iconBg: 'rgba(255,255,255,0.2)', fg: '#FFFFFF' };
  const map: Record<InAppNotificationType, typeof base & { bg: string; icon: IconName }> = {
    chat: {
      ...base,
      bg: colors.surface,
      border: colors.border,
      title: colors.text,
      body: colors.textSecondary,
      icon: 'chatbubble',
    },
    success: { ...base, bg: colors.primary, icon: 'checkmark-circle' },
    warning: { ...base, bg: '#B45309', icon: 'warning' },
    error: { ...base, bg: colors.error, icon: 'alert-circle' },
    info: { ...base, bg: colors.info, icon: 'information-circle' },
  };
  return map[type];
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 12, right: 12, zIndex: 1000, elevation: 1000 },
  banner: { borderRadius: Radius.lg, borderWidth: 1 },
  pressable: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { fontWeight: '700' },
});

export default NotificationBanner;
