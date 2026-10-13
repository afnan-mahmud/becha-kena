import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/constants/theme';

const MARIGOLD = '#F4B400';

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  /** Read-only displays may show half stars (e.g. average 4.5) */
  allowHalf?: boolean;
}

function Star({
  index,
  value,
  size,
  readOnly,
  allowHalf,
  emptyColor,
  onPress,
}: {
  index: number;
  value: number;
  size: number;
  readOnly: boolean;
  allowHalf: boolean;
  emptyColor: string;
  onPress: (v: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const filled = value >= index;
  const half = allowHalf && !filled && value >= index - 0.5;

  // Spring "pop" when a star becomes filled (only for interactive ratings)
  useEffect(() => {
    if (readOnly || reduceMotion) return;
    if (filled) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 90 }),
        withSpring(1, { damping: 8, stiffness: 260 })
      );
    }
  }, [filled, readOnly, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const icon = filled ? 'star' : half ? 'star-half' : 'star-outline';
  const color = filled || half ? MARIGOLD : emptyColor;

  if (readOnly) {
    return <Ionicons name={icon} size={size} color={color} />;
  }

  return (
    <Pressable
      onPress={() => onPress(index)}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${index} স্টার`}
    >
      <Animated.View style={style}>
        <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={filled ? MARIGOLD : emptyColor} />
      </Animated.View>
    </Pressable>
  );
}

/** 1-5 whole stars, spring fill gray → marigold, haptic tick on change (Prompt 34) */
export function StarRating({ value, onChange, size = 20, readOnly = false, allowHalf = false }: StarRatingProps) {
  const { colors } = useTheme();

  const handlePress = (v: number) => {
    if (v !== value) {
      Haptics.selectionAsync().catch(() => {});
    }
    onChange?.(v);
  };

  return (
    <View
      style={[styles.row, { gap: size * 0.15 }]}
      accessibilityLabel={`রেটিং ${value} / ৫`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          index={i}
          value={value}
          size={size}
          readOnly={readOnly || !onChange}
          allowHalf={allowHalf}
          emptyColor={colors.borderDark}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default StarRating;
