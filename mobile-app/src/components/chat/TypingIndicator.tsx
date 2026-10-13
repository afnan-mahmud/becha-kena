import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';

function Dot({ delay, color }: { delay: number; color: string }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-5, { duration: 260 }), withTiming(0, { duration: 260 })), -1, false)
    );
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

/** Three bouncing dots inside a "theirs" bubble (Prompt 31) */
export function TypingIndicator() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.row} accessibilityLabel="টাইপ করছে">
      <View style={[styles.bubble, { backgroundColor: colors.chatTheirs, borderColor: colors.chatTheirsBorder }]}>
        {[0, 150, 300].map((d) => (
          <Dot key={d} delay={d} color={colors.textMuted} />
        ))}
      </View>
    </Animated.View>
  );
}

/** Small inline version for the chat list ("টাইপ করছে…") */
export function TypingDots({ color }: { color: string }) {
  return (
    <View style={styles.inline}>
      {[0, 150, 300].map((d) => (
        <Dot key={d} delay={d} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginVertical: 4, flexDirection: 'row' },
  bubble: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  inline: { flexDirection: 'row', gap: 3, alignItems: 'center', height: 14 },
});

export default TypingIndicator;
