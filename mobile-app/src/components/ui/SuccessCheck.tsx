import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const CONFETTI_COLORS = ['#00704A', '#E63946', '#F4B400', '#2563EB', '#0E9F6E', '#F4B400', '#E63946', '#00704A'];

function ConfettiDot({ index, size, color }: { index: number; size: number; color: string }) {
  const progress = useSharedValue(0);
  const angle = (index / CONFETTI_COLORS.length) * Math.PI * 2;
  const distance = size * 0.85;

  useEffect(() => {
    progress.set(withDelay(180, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })));
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

/**
 * Animated success checkmark: circle scales in, check pops, brand-coloured
 * confetti dots burst out (Prompt 23/45). Static when "Reduce Motion" is on.
 */
export function SuccessCheck({ size = 96, color = '#00704A' }: { size?: number; color?: string }) {
  const reduceMotion = useReducedMotion();
  const circle = useSharedValue(reduceMotion ? 1 : 0);
  const check = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (reduceMotion) return;
    circle.set(withSpring(1, { damping: 12, stiffness: 160 }));
    check.set(withDelay(220, withSpring(1, { damping: 9, stiffness: 220 })));
  }, [circle, check, reduceMotion]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circle.value }] }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: 0.4 + check.value * 0.6 }, { rotate: `${(1 - check.value) * -30}deg` }],
  }));

  return (
    <View style={[styles.wrapper, { width: size * 2, height: size * 2 }]}>
      {!reduceMotion
        ? CONFETTI_COLORS.map((c, i) => <ConfettiDot key={i} index={i} size={size} color={c} />)
        : null}
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          circleStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
});

export default SuccessCheck;
