import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import { toBanglaDigits } from '@/lib/format';
import { AppText } from './AppText';

/** Animated progress bar with "২/৪ · title" label for multi-step forms */
export function StepProgress({ step, total, title }: { step: number; total: number; title?: string }) {
  const { colors } = useTheme();
  const progress = useSharedValue(step / total);

  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 300 });
  }, [step, total, progress]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <AppText variant="bodySmall" color={colors.primary} style={styles.bold}>
          ধাপ {toBanglaDigits(step)}/{toBanglaDigits(total)}
        </AppText>
        {title ? (
          <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.bar, { backgroundColor: colors.primary }, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 10 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 12 },
  bold: { fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
});

export default StepProgress;
