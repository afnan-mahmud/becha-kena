import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Radius, useTheme } from '@/constants/theme';
import { SUPPORT_EMAIL, WEB_LINKS, WEB_URL } from '@/constants/api';
import { openWebPage } from '@/lib/web';
import { toast } from '@/lib/toast';
import { AppText, ListRow, ListSection } from '@/components/ui';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'shield-checkmark-outline', title: '১. NID দিয়ে যাচাই', text: 'একবার জাতীয় পরিচয়পত্র দিয়ে যাচাই করুন — সবাই ভেরিফাইড।' },
  { icon: 'camera-outline', title: '২. বিজ্ঞাপন দিন বা খুঁজুন', text: 'ছবি তুলে মিনিটেই বিজ্ঞাপন দিন, এলাকা ও দাম দিয়ে খুঁজুন।' },
  { icon: 'chatbubbles-outline', title: '৩. চ্যাট করে সামনাসামনি ডিল', text: 'নম্বর না দিয়েই চ্যাট করুন, দেখে-শুনে কিনুন।' },
];

const SOCIAL: { icon: keyof typeof Ionicons.glyphMap; label: string; url: string }[] = [
  { icon: 'logo-facebook', label: 'Facebook', url: 'https://facebook.com/bechakena' },
  { icon: 'logo-youtube', label: 'YouTube', url: 'https://youtube.com/@bechakena' },
  { icon: 'globe-outline', label: 'Website', url: WEB_URL },
];

/** About (Prompt 43) */
export default function AboutScreen() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const email = () =>
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('বেচা-কেনা অ্যাপ সহায়তা')}`).catch(() =>
      toast.info(`ইমেইল করুন: ${SUPPORT_EMAIL}`)
    );

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="swap-horizontal" size={44} color="#FFFFFF" />
          <View style={[styles.logoDot, { backgroundColor: colors.accent, borderColor: colors.primary }]} />
        </View>
        <AppText variant="heading1" color={colors.primary}>
          বেচা-কেনা
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          সংস্করণ {version}
        </AppText>
        <AppText variant="heading3" align="center" style={styles.tagline}>
          বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস
        </AppText>
        <AppText variant="body" align="center" color={colors.textSecondary}>
          ১০০% NID-যাচাইকৃত ইউজার — নিরাপদ, প্রতারণামুক্ত কেনা-বেচা
        </AppText>
      </View>

      <AppText variant="heading3" style={styles.sectionTitle}>
        কীভাবে কাজ করে
      </AppText>
      {STEPS.map((s) => (
        <View key={s.title} style={[styles.step, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={s.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="body" style={styles.bold}>
              {s.title}
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {s.text}
            </AppText>
          </View>
        </View>
      ))}

      <View style={styles.links}>
        <ListSection>
          <ListRow emoji="📜" label="শর্তাবলি" onPress={() => openWebPage(WEB_LINKS.terms)} />
          <ListRow emoji="🔒" label="গোপনীয়তা নীতি" onPress={() => openWebPage(WEB_LINKS.privacy)} />
          <ListRow emoji="✉️" label="সহায়তা" value={SUPPORT_EMAIL} onPress={email} isLast />
        </ListSection>
      </View>

      <View style={styles.social}>
        {SOCIAL.map((s) => (
          <Pressable
            key={s.label}
            onPress={() => Linking.openURL(s.url).catch(() => {})}
            style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel={s.label}
          >
            <Ionicons name={s.icon} size={22} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" color={colors.textMuted} align="center">
        সব লেনদেন ক্রেতা ও বিক্রেতার নিজ দায়িত্বে সামনাসামনি সম্পন্ন হয়।{'\n'}© {new Date().getFullYear()} বেচা-কেনা
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  content: { paddingVertical: 24, paddingBottom: 48 },
  hero: { alignItems: 'center', paddingHorizontal: 24, gap: 4, marginBottom: 16 },
  logo: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoDot: { position: 'absolute', top: 12, right: 12, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  tagline: { marginTop: 12 },
  sectionTitle: { paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  stepIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  links: { marginTop: 16 },
  social: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  socialBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
