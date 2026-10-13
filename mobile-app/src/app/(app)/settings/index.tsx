import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useTheme } from '@/constants/theme';
import { WEB_LINKS } from '@/constants/api';
import { kycService } from '@/services/kyc.service';
import { useAuthStore } from '@/store/auth.store';
import { ThemeMode, useUiStore } from '@/store/ui.store';
import { toast } from '@/lib/toast';
import { openWebPage } from '@/lib/web';
import { LocationPicker } from '@/components/common/LocationPicker';
import { AppText, BottomSheet, ListRow, ListSection } from '@/components/ui';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'সিস্টেম অনুযায়ী', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'লাইট', icon: 'sunny-outline' },
  { value: 'dark', label: 'ডার্ক', icon: 'moon-outline' },
];

/** Settings (Prompt 41) */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const themeMode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);
  const division = useUiStore((s) => s.selectedDivision);
  const setDivision = useUiStore((s) => s.setSelectedDivision);
  const [themeOpen, setThemeOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  const isVerified = user?.isVerified ?? false;
  const { data: kycLog } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycService.getStatus,
    enabled: !isVerified,
    staleTime: 60_000,
  });

  const kycText = isVerified
    ? 'ভেরিফাইড ✅'
    : kycLog?.verificationStatus === 'pending_review'
    ? 'রিভিউ চলছে'
    : kycLog?.verificationStatus === 'rejected'
    ? 'বাতিল — আবার চেষ্টা করুন'
    : 'যাচাই হয়নি';

  const openKyc = () => {
    if (isVerified || kycLog?.verificationStatus === 'pending_review') router.push('/(app)/kyc/status');
    else router.push('/(app)/kyc');
  };

  const confirmLogout = () =>
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'লগআউট', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <ListSection title="অ্যাকাউন্ট">
        <ListRow emoji="👤" label="প্রোফাইল এডিট" onPress={() => router.push('/(app)/settings/edit-profile')} />
        <ListRow emoji="🪪" label="NID ভেরিফিকেশন" value={kycText} onPress={openKyc} />
        <ListRow emoji="🚩" label="আমার রিপোর্ট" onPress={() => router.push('/(app)/settings/my-reports')} isLast />
      </ListSection>

      <ListSection title="পছন্দ">
        <ListRow emoji="🔔" label="নোটিফিকেশন" onPress={() => router.push('/(app)/settings/notifications')} />
        <ListRow emoji="📍" label="ডিফল্ট এলাকা" value={division ?? 'সারা বাংলাদেশ'} onPress={() => setAreaOpen(true)} />
        <ListRow
          emoji="🌙"
          label="থিম"
          value={THEME_OPTIONS.find((t) => t.value === themeMode)?.label}
          onPress={() => setThemeOpen(true)}
        />
        <ListRow
          emoji="🌐"
          label="ভাষা"
          value="বাংলা"
          onPress={() => toast.info('English শীঘ্রই আসছে', { body: 'আপাতত অ্যাপটি বাংলায় পাওয়া যাচ্ছে।' })}
          isLast
        />
      </ListSection>

      <ListSection title="তথ্য">
        <ListRow emoji="📜" label="শর্তাবলি" onPress={() => openWebPage(WEB_LINKS.terms)} />
        <ListRow emoji="🔒" label="গোপনীয়তা নীতি" onPress={() => openWebPage(WEB_LINKS.privacy)} />
        <ListRow emoji="ℹ️" label="বেচা-কেনা সম্পর্কে" onPress={() => router.push('/(app)/settings/about')} isLast />
      </ListSection>

      <ListSection title="বিপজ্জনক">
        <ListRow emoji="🗑️" label="অ্যাকাউন্ট মুছুন" destructive onPress={() => router.push('/(app)/settings/delete-account')} />
        <ListRow emoji="🚪" label="লগআউট" destructive onPress={confirmLogout} isLast />
      </ListSection>

      <AppText variant="caption" color={colors.textMuted} align="center">
        বেচা-কেনা v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>

      {/* Theme picker */}
      <BottomSheet visible={themeOpen} onClose={() => setThemeOpen(false)} title="থিম" snapPoints={[0.4]}>
        <View style={styles.sheet}>
          {THEME_OPTIONS.map((opt) => {
            const active = opt.value === themeMode;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setThemeMode(opt.value);
                  setThemeOpen(false);
                }}
                style={[styles.option, { borderBottomColor: colors.border }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={opt.icon} size={20} color={colors.textSecondary} />
                <AppText variant="body" style={styles.flex}>
                  {opt.label}
                </AppText>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* Default area for the home feed */}
      <LocationPicker
        visible={areaOpen}
        onClose={() => setAreaOpen(false)}
        value={division ? { division } : null}
        onSelect={(sel) => setDivision(sel?.division ?? null)}
        title="ডিফল্ট এলাকা"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 48 },
  sheet: { paddingHorizontal: 16 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
