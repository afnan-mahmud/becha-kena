import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AppText } from '@/components/ui/AppText';

/**
 * Amber bar under the status bar while the device is offline (Prompt 46).
 * Slides down on disconnect and back up on reconnect. Mounted in the root layout.
 */
export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(!isConnected);
  const translateY = useSharedValue(-80);
  if (!isConnected && !visible) setVisible(true);

  useEffect(() => {
    if (!isConnected) {
      translateY.set(withTiming(0, { duration: 250 }));
    } else {
      translateY.set(withTiming(-80, { duration: 250 }, (done) => {
        if (done) scheduleOnRN(setVisible, false);
      }));
    }
  }, [isConnected, translateY]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.bar, { paddingTop: insets.top + 6 }, style]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
      <AppText variant="caption" style={styles.text}>
        আপনি অফলাইনে আছেন। কিছু ফিচার কাজ নাও করতে পারে।
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B45309',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: { color: '#FFFFFF', fontWeight: '600', flexShrink: 1 },
});

export default OfflineBanner;
