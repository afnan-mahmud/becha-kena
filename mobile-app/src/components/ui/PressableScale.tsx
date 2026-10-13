import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed (default 0.97) */
  activeScale?: number;
  /** Light haptic tick on press — use it for primary actions */
  haptic?: boolean;
  children?: React.ReactNode;
}

/**
 * Pressable that shrinks slightly while pressed (Prompt 45).
 * Skips the animation when the OS "Reduce Motion" setting is on.
 */
export function PressableScale({
  style,
  activeScale = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...props
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        if (!reduceMotion) scale.set(withTiming(activeScale, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduceMotion) scale.set(withSpring(1, { damping: 14, stiffness: 260 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;
