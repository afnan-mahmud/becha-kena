import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Radius, useTheme } from '@/constants/theme';
import { AppText, Button } from '@/components/ui';

const DISCLAIMER_KEY = 'bk_disclaimer_accepted';

/**
 * One-time disclaimer shown after the first successful login (Prompt 43).
 * The flag lives in AsyncStorage, so it appears once per device.
 */
export function DisclaimerModal() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY)
      .then((v) => {
        if (!v) setVisible(true);
      })
      .catch(() => {});
  }, []);

  const accept = () => {
    setVisible(false);
    AsyncStorage.setItem(DISCLAIMER_KEY, '1').catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={accept} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.duration(250)} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.icon, { backgroundColor: colors.secondarySoft }]}>
            <Ionicons name="hand-left-outline" size={32} color={colors.warning} />
          </View>
          <AppText variant="heading3" align="center" style={styles.title}>
            গুরুত্বপূর্ণ তথ্য
          </AppText>
          <AppText variant="body" align="center" color={colors.textSecondary}>
            সব লেনদেন ক্রেতা ও বিক্রেতার নিজ দায়িত্বে সামনাসামনি সম্পন্ন হয়। বেচা-কেনা কোনো আর্থিক লেনদেনের নিশ্চয়তা দেয় না।
          </AppText>
          <Button title="বুঝেছি" onPress={accept} fullWidth style={styles.button} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: Radius.xl, padding: 24, alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { marginBottom: 8 },
  button: { marginTop: 20 },
});

export default DisclaimerModal;
