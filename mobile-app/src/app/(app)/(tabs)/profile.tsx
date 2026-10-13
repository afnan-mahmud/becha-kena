import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Radius, Shadows, useTheme } from '@/constants/theme';
import { formatMonthYear, maskPhone, toBanglaDigits } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import { useMyListingsCount } from '@/hooks/useListings';
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner';
import { AppText, Avatar, ListRow, ListSection, Skeleton, StarRating } from '@/components/ui';

function Stat({ label, value, onPress }: { label: string; value?: number; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.stat,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { backgroundColor: colors.backgroundSubtle },
      ]}
    >
      {value === undefined ? (
        <Skeleton width={36} height={24} />
      ) : (
        <AppText variant="heading2" color={colors.primary}>
          {toBanglaDigits(value)}
        </AppText>
      )}
      <AppText variant="caption" color={colors.textSecondary} align="center">
        {label}
      </AppText>
    </Pressable>
  );
}

/** Profile tab (Prompt 32). The backend has no profile photo → initial-letter avatar. */
export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);
  const [refreshing, setRefreshing] = useState(false);

  const isVerified = user?.isVerified ?? false;
  const activeCount = useMyListingsCount('active');
  const soldCount = useMyListingsCount('sold');

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), activeCount.refetch(), soldCount.refetch()]);
    setRefreshing(false);
  };

  const confirmLogout = () =>
    Alert.alert('লগআউট', 'আপনি কি লগআউট করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'লগআউট', style: 'destructive', onPress: () => logout() },
    ]);

  if (!user) return null;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={[colors.primary]} />}
    >
      {/* Green patterned cover */}
      <View style={[styles.cover, { backgroundColor: colors.primary, paddingTop: insets.top + 12 }]}>
        <View style={[styles.pattern, styles.pattern1]} />
        <View style={[styles.pattern, styles.pattern2]} />
        <View style={styles.coverTop}>
          <AppText variant="heading3" style={styles.coverTitle}>
            আমার প্রোফাইল
          </AppText>
          <Pressable onPress={() => router.push('/(app)/settings')} hitSlop={10} accessibilityLabel="সেটিংস">
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Header card */}
      <View style={[styles.card, Shadows.md, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Avatar name={user.displayName} size={72} verified={isVerified} />
          <View style={styles.flex}>
            <AppText variant="heading2" numberOfLines={1}>
              {user.displayName}
            </AppText>
            {isVerified ? (
              <View style={styles.inline}>
                <Ionicons name="shield-checkmark" size={14} color={colors.verified} />
                <AppText variant="caption" color={colors.verified} style={styles.bold}>
                  NID ভেরিফাইড
                </AppText>
              </View>
            ) : null}
            {user.verifiedName ? (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                আইনগত নাম: {user.verifiedName}
              </AppText>
            ) : null}
            <AppText variant="caption" color={colors.textMuted}>
              📱 {maskPhone(user.phoneNumber)} • সদস্য: {formatMonthYear(user.createdAt)}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/settings/edit-profile')}
            style={[styles.editBtn, { backgroundColor: colors.primarySoft }]}
            accessibilityLabel="প্রোফাইল এডিট"
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {user.totalReviews > 0 ? (
          <View style={[styles.inline, styles.rating]}>
            <StarRating value={user.averageRating} readOnly allowHalf size={16} />
            <AppText variant="bodySmall" style={styles.bold}>
              {toBanglaDigits(user.averageRating.toFixed(1))}
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              ({toBanglaDigits(user.totalReviews)} রিভিউ)
            </AppText>
          </View>
        ) : null}

        {!isVerified ? (
          <View style={styles.banner}>
            <KYCStatusBanner />
          </View>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat
          label="সক্রিয় বিজ্ঞাপন"
          value={activeCount.data ?? (activeCount.isError ? 0 : undefined)}
          onPress={() => router.push({ pathname: '/(app)/my-listings', params: { tab: 'active' } })}
        />
        <Stat
          label="বিক্রিত"
          value={soldCount.data ?? (soldCount.isError ? 0 : undefined)}
          onPress={() => router.push({ pathname: '/(app)/my-listings', params: { tab: 'sold' } })}
        />
        <Stat
          label="রিভিউ"
          value={user.totalReviews}
          onPress={() => router.push({ pathname: '/(app)/user/[id]', params: { id: user.id, tab: 'reviews' } })}
        />
      </View>

      {/* Menu */}
      <ListSection>
        <ListRow emoji="📋" label="আমার বিজ্ঞাপন" onPress={() => router.push('/(app)/my-listings')} />
        <ListRow
          emoji="⭐"
          label="আমার রিভিউ"
          onPress={() => router.push({ pathname: '/(app)/user/[id]', params: { id: user.id, tab: 'reviews' } })}
        />
        <ListRow emoji="🚩" label="আমার রিপোর্ট" onPress={() => router.push('/(app)/settings/my-reports')} />
        <ListRow emoji="🔔" label="নোটিফিকেশন" onPress={() => router.push('/(app)/settings/notifications')} />
        <ListRow emoji="⚙️" label="সেটিংস" onPress={() => router.push('/(app)/settings')} />
        <ListRow emoji="ℹ️" label="বেচা-কেনা সম্পর্কে" onPress={() => router.push('/(app)/settings/about')} isLast />
      </ListSection>

      <ListSection>
        <ListRow emoji="🚪" label="লগআউট" destructive onPress={confirmLogout} isLast />
      </ListSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  cover: { height: 140, overflow: 'hidden', paddingHorizontal: 16 },
  pattern: { position: 'absolute', borderRadius: 999 },
  pattern1: { width: 200, height: 200, top: -80, right: -50, backgroundColor: 'rgba(255,255,255,0.08)' },
  pattern2: { width: 110, height: 110, bottom: -60, left: 20, backgroundColor: 'rgba(244,180,0,0.18)' },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverTitle: { color: '#FFFFFF' },
  card: { marginHorizontal: 16, marginTop: -64, borderRadius: Radius.xl, borderWidth: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { marginTop: 12, gap: 6 },
  editBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  banner: { marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginVertical: 16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: Radius.lg, borderWidth: 1, gap: 2 },
});
