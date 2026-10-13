import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Radius, useTheme } from '@/constants/theme';
import { AppText } from './AppText';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Heights as fractions of the screen, smallest first (default 60% / 90%) */
  snapPoints?: number[];
  /** Index of the snap point to open at */
  initialSnap?: number;
  title?: string;
  /** Sticky area under the content (e.g. Reset / Apply buttons) */
  footer?: React.ReactNode;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  /** Close when the backdrop is tapped (default true) */
  dismissOnBackdrop?: boolean;
}

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

/**
 * Bottom sheet built on a React Native Modal + Reanimated (Prompt 18 fallback —
 * no extra native dependency, works with Reanimated 4 / SDK 57).
 * Drag the handle to move between snap points or swipe down to dismiss.
 */
export function BottomSheet({
  visible,
  onClose,
  snapPoints = [0.6, 0.9],
  initialSnap = 0,
  title,
  footer,
  children,
  contentStyle,
  dismissOnBackdrop = true,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const snapHeights = snapPoints.map((p) => p * screenHeight);
  const minHeight = Math.min(...snapHeights);
  const maxHeight = Math.max(...snapHeights);
  const openHeight = snapHeights[initialSnap] ?? snapHeights[0];

  const [mounted, setMounted] = useState(visible);
  // Mount as soon as we become visible (render-time update, no effect needed)
  if (visible && !mounted) setMounted(true);
  // The sheet's visible height moves between snap points; translateY is only
  // used for the open / close slide and for dragging below the lowest snap.
  const height = useSharedValue(openHeight);
  const translateY = useSharedValue(screenHeight);
  const backdrop = useSharedValue(0);
  const dragStartHeight = useSharedValue(0);

  const finishClose = useCallback(() => setMounted(false), []);

  useEffect(() => {
    if (visible) {
      height.set(openHeight);
      translateY.set(openHeight);
      translateY.set(withSpring(0, SPRING));
      backdrop.set(withTiming(1, { duration: 220 }));
    } else if (mounted) {
      backdrop.set(withTiming(0, { duration: 200 }));
      translateY.set(withTiming(
        height.value + 40,
        { duration: 220, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(finishClose);
        }
      ));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = Gesture.Pan()
    .onStart(() => {
      dragStartHeight.set(height.value + translateY.value * -1);
    })
    .onUpdate((e) => {
      const proposed = dragStartHeight.value - e.translationY;
      if (proposed >= minHeight) {
        height.set(Math.min(proposed, maxHeight));
        translateY.set(0);
      } else {
        height.set(minHeight);
        translateY.set(minHeight - proposed);
      }
    })
    .onEnd((e) => {
      // Fast flick down or dragged well below the lowest snap → dismiss
      if (translateY.value > minHeight * 0.3 || (e.velocityY > 1200 && height.value <= minHeight + 1)) {
        scheduleOnRN(onClose);
        return;
      }
      // Otherwise settle on the nearest snap point (biased by flick direction)
      const projected = height.value - e.velocityY * 0.1;
      let target = snapHeights[0];
      let best = Number.MAX_VALUE;
      for (const h of snapHeights) {
        const d = Math.abs(h - projected);
        if (d < best) {
          best = d;
          target = h;
        }
      }
      translateY.set(withSpring(0, SPRING));
      height.set(withSpring(target, SPRING));
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: height.value,
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.flex}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={styles.flex}
            onPress={dismissOnBackdrop ? onClose : undefined}
            accessibilityLabel="বন্ধ করুন"
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface },
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={pan}>
              <View style={styles.header}>
                <View style={[styles.handle, { backgroundColor: colors.borderDark }]} />
                {title ? (
                  <View style={styles.titleRow}>
                    <AppText variant="heading3" style={styles.flex} numberOfLines={1}>
                      {title}
                    </AppText>
                    <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="বন্ধ করুন">
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </GestureDetector>

            <View style={[styles.content, contentStyle]}>{children}</View>

            {footer ? (
              <View
                style={[
                  styles.footer,
                  {
                    borderTopColor: colors.border,
                    paddingBottom: Math.max(insets.bottom, 12),
                  },
                ]}
              >
                {footer}
              </View>
            ) : (
              <View style={{ height: insets.bottom }} />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  keyboardContainer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  header: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 4 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 12 },
  content: { flex: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12 },
});

export default BottomSheet;
