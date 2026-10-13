import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/constants/theme';
import { AppText, BottomSheet, Button } from '@/components/ui';

/** Explains WHY before the OS permission dialog appears (Prompt 36) */
export function NotificationPermissionSheet({
  visible,
  onAllow,
  onLater,
}: {
  visible: boolean;
  onAllow: () => void;
  onLater: () => void;
}) {
  const { colors } = useTheme();
  const points = [
    { icon: 'chatbubble-ellipses-outline' as const, text: 'ক্রেতা/বিক্রেতার নতুন মেসেজ' },
    { icon: 'shield-checkmark-outline' as const, text: 'NID যাচাইয়ের ফলাফল' },
    { icon: 'megaphone-outline' as const, text: 'বিজ্ঞাপন অনুমোদন ও মেয়াদ শেষের রিমাইন্ডার' },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onLater}
      snapPoints={[0.55]}
      footer={
        <View style={styles.footer}>
          <Button title="নোটিফিকেশন চালু করুন" onPress={onAllow} fullWidth size="lg" />
          <Button title="পরে" variant="ghost" onPress={onLater} fullWidth />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="notifications" size={40} color={colors.primary} />
        </View>
        <AppText variant="heading2" align="center">
          কোনো আপডেট মিস করবেন না
        </AppText>
        <AppText variant="bodySmall" align="center" color={colors.textSecondary} style={styles.sub}>
          নোটিফিকেশন চালু করলে আমরা জানাব —
        </AppText>
        {points.map((p) => (
          <View key={p.text} style={styles.point}>
            <Ionicons name={p.icon} size={20} color={colors.primary} />
            <AppText variant="body">{p.text}</AppText>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sub: { marginTop: 4, marginBottom: 12 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingVertical: 6 },
  footer: { gap: 4 },
});

export default NotificationPermissionSheet;
