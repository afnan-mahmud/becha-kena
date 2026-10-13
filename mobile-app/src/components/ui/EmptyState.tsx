import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type IconName = keyof typeof Ionicons.glyphMap;

export type EmptyStateVariant =
  | 'noListings'
  | 'noChats'
  | 'noReviews'
  | 'noResults'
  | 'noReports'
  | 'offline'
  | 'error';

const PRESETS: Record<EmptyStateVariant, { icon: IconName; title: string; subtitle?: string; tone: 'green' | 'red' | 'yellow' | 'blue' }> = {
  noListings: { icon: 'pricetags-outline', title: 'এখানে কোনো বিজ্ঞাপন নেই', tone: 'green' },
  noChats: {
    icon: 'chatbubbles-outline',
    title: 'এখনো কোনো চ্যাট নেই',
    subtitle: 'কোনো বিজ্ঞাপন থেকে বিক্রেতার সাথে চ্যাট শুরু করুন।',
    tone: 'green',
  },
  noReviews: { icon: 'star-outline', title: 'এখনো কোনো রিভিউ নেই', tone: 'yellow' },
  noResults: {
    icon: 'search-outline',
    title: 'কোনো বিজ্ঞাপন পাওয়া যায়নি',
    subtitle: 'অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন বা ফিল্টার কমান।',
    tone: 'blue',
  },
  noReports: { icon: 'flag-outline', title: 'আপনি কোনো রিপোর্ট করেননি', tone: 'blue' },
  offline: {
    icon: 'cloud-offline-outline',
    title: 'আপনি অফলাইনে আছেন',
    subtitle: 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    tone: 'yellow',
  },
  error: {
    icon: 'alert-circle-outline',
    title: 'কিছু একটা সমস্যা হয়েছে',
    subtitle: 'ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
    tone: 'red',
  },
};

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: IconName;
  emoji?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

/** Big icon in a tinted circle + title + subtitle + optional action (Prompt 44) */
export function EmptyState({
  variant = 'noListings',
  icon,
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  compact = false,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const { isConnected } = useNetworkStatus();
  // An error while offline is almost always the connection — say so (Prompt 46)
  if (variant === 'error' && !isConnected) {
    variant = 'offline';
    title = undefined;
    subtitle = undefined;
  }
  const preset = PRESETS[variant];

  const toneColors = {
    green: { bg: colors.primarySoft, fg: colors.primary },
    red: { bg: colors.errorSoft, fg: colors.error },
    yellow: { bg: colors.secondarySoft, fg: colors.warning },
    blue: { bg: colors.infoSoft, fg: colors.info },
  }[preset.tone];

  const resolvedAction =
    actionLabel ?? (variant === 'error' || variant === 'offline' ? 'আবার চেষ্টা করুন' : undefined);
  const circle = compact ? 64 : 88;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={[styles.container, compact && styles.compact, style]}>
      <View
        style={[
          styles.circle,
          { width: circle, height: circle, borderRadius: circle / 2, backgroundColor: toneColors.bg },
        ]}
      >
        {emoji ? (
          <AppText style={{ fontSize: circle * 0.45, lineHeight: circle * 0.6 }}>{emoji}</AppText>
        ) : (
          <Ionicons name={icon ?? preset.icon} size={circle * 0.45} color={toneColors.fg} />
        )}
      </View>
      <AppText variant="heading3" align="center" style={styles.title}>
        {title ?? preset.title}
      </AppText>
      {subtitle ?? preset.subtitle ? (
        <AppText variant="bodySmall" align="center" color={colors.textSecondary} style={styles.subtitle}>
          {subtitle ?? preset.subtitle}
        </AppText>
      ) : null}
      {resolvedAction && onAction ? (
        <Button
          title={resolvedAction}
          onPress={onAction}
          variant={variant === 'error' ? 'outline' : 'primary'}
          size="sm"
          style={styles.action}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  compact: { paddingVertical: 24 },
  circle: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { marginBottom: 6 },
  subtitle: { marginBottom: 4, maxWidth: 300 },
  action: { marginTop: 16, minWidth: 160 },
});

export default EmptyState;
