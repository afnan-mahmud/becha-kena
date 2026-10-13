import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import { AppText, Button, SuccessCheck } from '@/components/ui';

export interface AdSubmitSuccessProps {
  visible: boolean;
  onViewMyAds: () => void;
  onPostAnother: () => void;
  onGoHome: () => void;
}

/** Full-screen celebration after POST /listings (Prompt 23) */
export function AdSubmitSuccess({ visible, onViewMyAds, onPostAnother, onGoHome }: AdSubmitSuccessProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onGoHome} statusBarTranslucent>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          {visible ? <SuccessCheck size={96} /> : null}
          <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.texts}>
            <AppText variant="heading1" align="center">
              বিজ্ঞাপন জমা হয়েছে! 🎉
            </AppText>
            <AppText variant="body" align="center" color={colors.textSecondary} style={styles.subtitle}>
              আমাদের টিম দ্রুত রিভিউ করবে। অনুমোদনের পর সবাই দেখতে পাবে এবং ৩০ দিন সক্রিয় থাকবে।
            </AppText>
          </Animated.View>
        </View>
        <Animated.View entering={FadeInUp.delay(550).duration(400)} style={styles.actions}>
          <Button title="আমার বিজ্ঞাপন দেখুন" onPress={onViewMyAds} fullWidth size="lg" />
          <Button title="আরেকটি বিজ্ঞাপন দিন" variant="outline" onPress={onPostAnother} fullWidth />
          <Button title="হোমে যান" variant="ghost" onPress={onGoHome} fullWidth />
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texts: { marginTop: 8 },
  subtitle: { marginTop: 10, paddingHorizontal: 8 },
  actions: { gap: 10, paddingBottom: 8 },
});

export default AdSubmitSuccess;
