import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Radius, useTheme } from '@/constants/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}

/** Opacity-pulse placeholder block */
export function Skeleton({ width = '100%', height = 14, radius = Radius.sm, style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? colors.border : '#ECE8DF',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Chat list row placeholder */
export function SkeletonChatRow() {
  return (
    <View style={styles.chatRow}>
      <Skeleton width={52} height={52} radius={26} />
      <View style={styles.chatLines}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="80%" height={12} style={styles.gap} />
        <Skeleton width="40%" height={10} style={styles.gap} />
      </View>
    </View>
  );
}

/** Profile header placeholder */
export function SkeletonProfile() {
  return (
    <View style={styles.profile}>
      <Skeleton width={84} height={84} radius={42} />
      <Skeleton width={160} height={18} style={styles.gapLg} />
      <Skeleton width={110} height={12} style={styles.gap} />
      <View style={styles.statsRow}>
        <Skeleton width="30%" height={56} radius={Radius.lg} />
        <Skeleton width="30%" height={56} radius={Radius.lg} />
        <Skeleton width="30%" height={56} radius={Radius.lg} />
      </View>
    </View>
  );
}

/** Generic card-shaped placeholder list (e.g. my listings, reports) */
export function SkeletonList({ count = 4, height = 96 }: { count?: number; height?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} radius={Radius.lg} />
      ))}
    </View>
  );
}

export { ListingCardSkeleton as SkeletonListingCard } from '@/components/listing/ListingCard';

const styles = StyleSheet.create({
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  chatLines: { flex: 1 },
  gap: { marginTop: 8 },
  gapLg: { marginTop: 16 },
  profile: { alignItems: 'center', padding: 24 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  list: { padding: 16, gap: 12 },
});
