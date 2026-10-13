import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Radius, useTheme } from '@/constants/theme';
import { daysUntil, formatDate, formatPrice, toBanglaDigits } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { useDeleteListing, useMyListings, useRenewListing } from '@/hooks/useListings';
import { ModerationBadge, isRejected } from '@/components/listing/ModerationBadge';
import { MarkAsSoldSheet } from '@/components/listing/MarkAsSoldSheet';
import { AppText, Button, EmptyState, SegmentedTabs, SkeletonList } from '@/components/ui';
import type { Listing, ListingStatus } from '@/types/listing.types';

type Tab = 'all' | ListingStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'active', label: 'সক্রিয়' },
  { key: 'pending', label: 'রিভিউতে' },
  { key: 'sold', label: 'বিক্রিত' },
  { key: 'archived', label: 'আর্কাইভড' },
];

const isTab = (v?: string): v is Tab => !!v && TABS.some((t) => t.key === v);

function MyListingCard({
  listing,
  index,
  onSell,
  onRenew,
  onDelete,
  busy,
}: {
  listing: Listing;
  index: number;
  onSell: (l: Listing) => void;
  onRenew: (l: Listing) => void;
  onDelete: (l: Listing) => void;
  busy: boolean;
}) {
  const { colors } = useTheme();
  const rejected = isRejected(listing);
  const daysLeft = listing.expiresAt ? daysUntil(listing.expiresAt) : null;
  const expiringSoon = listing.status === 'active' && daysLeft !== null && daysLeft <= 5 && daysLeft >= 0;

  const actions: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; tone?: 'danger' | 'primary' }[] = [];
  if (listing.status === 'active') {
    actions.push({ label: 'বিক্রি হয়েছে', icon: 'checkmark-done', onPress: () => onSell(listing), tone: 'primary' });
    if (expiringSoon) actions.push({ label: 'মেয়াদ বাড়ান', icon: 'refresh', onPress: () => onRenew(listing) });
    actions.push({ label: 'এডিট', icon: 'create-outline', onPress: () => router.push(`/(app)/listing/edit/${listing.id}`) });
    actions.push({ label: 'সরান', icon: 'trash-outline', onPress: () => onDelete(listing), tone: 'danger' });
  } else if (listing.status === 'pending') {
    actions.push({ label: 'এডিট', icon: 'create-outline', onPress: () => router.push(`/(app)/listing/edit/${listing.id}`) });
    actions.push({ label: 'সরান', icon: 'trash-outline', onPress: () => onDelete(listing), tone: 'danger' });
  } else if (listing.status === 'archived' && !rejected) {
    actions.push({ label: 'নবায়ন', icon: 'refresh', onPress: () => onRenew(listing), tone: 'primary' });
  }

  return (
    <Animated.View
      entering={index < 10 ? FadeInDown.delay(index * 40).duration(300) : undefined}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Pressable
        style={styles.cardTop}
        // sold / active ads have a public page; pending & archived ones are only visible to me
        onPress={() => router.push(`/(app)/listing/${listing.id}`)}
      >
        <Image
          source={{ uri: listing.images[0] }}
          style={[styles.thumb, { backgroundColor: colors.backgroundSubtle }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={listing.images[0]}
          transition={150}
        />
        <View style={styles.cardBody}>
          <AppText variant="body" numberOfLines={2} style={styles.title}>
            {listing.title}
          </AppText>
          <AppText variant="price" color={colors.primary} style={styles.price}>
            {formatPrice(listing.price)}
          </AppText>
          <ModerationBadge listing={listing} showReason={false} />
        </View>
      </Pressable>

      {rejected && listing.moderationFlags?.flagReason ? (
        <View style={[styles.reason, { backgroundColor: colors.errorSoft }]}>
          <Ionicons name="information-circle" size={16} color={colors.error} />
          <AppText variant="caption" color={colors.error} style={styles.flex}>
            বাতিলের কারণ: {listing.moderationFlags.flagReason}
          </AppText>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <AppText variant="caption" color={colors.textMuted}>
          পোস্ট: {formatDate(listing.createdAt, 'd MMM yyyy')}
        </AppText>
        {listing.status === 'active' && listing.expiresAt ? (
          <AppText variant="caption" color={expiringSoon ? colors.warning : colors.textMuted} style={expiringSoon ? styles.bold : undefined}>
            {expiringSoon
              ? `⏳ ${toBanglaDigits(Math.max(daysLeft ?? 0, 0))} দিন বাকি`
              : `মেয়াদ: ${formatDate(listing.expiresAt, 'd MMM yyyy')}`}
          </AppText>
        ) : null}
      </View>

      {actions.length ? (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {actions.map((a) => (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              disabled={busy}
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.backgroundSubtle }, busy && styles.disabled]}
              accessibilityRole="button"
            >
              <Ionicons
                name={a.icon}
                size={16}
                color={a.tone === 'danger' ? colors.error : a.tone === 'primary' ? colors.primary : colors.textSecondary}
              />
              <AppText
                variant="caption"
                style={styles.bold}
                color={a.tone === 'danger' ? colors.error : a.tone === 'primary' ? colors.primary : colors.textSecondary}
              >
                {a.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

/** Seller dashboard (Prompt 22) */
export default function MyListingsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(isTab(params.tab) ? params.tab : 'all');
  const [sellTarget, setSellTarget] = useState<Listing | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = useMyListings(tab === 'all' ? undefined : tab);
  const renew = useRenewListing();
  const remove = useDeleteListing();
  const busy = renew.isPending || remove.isPending;

  const handleRenew = useCallback(
    async (listing: Listing) => {
      try {
        await renew.mutateAsync(listing.id);
        toast.success('মেয়াদ ৩০ দিন বাড়ানো হয়েছে');
      } catch (err) {
        toast.error('নবায়ন করা যায়নি', { body: getErrorMessage(err) });
      }
    },
    [renew]
  );

  const handleDelete = useCallback(
    (listing: Listing) => {
      Alert.alert('বিজ্ঞাপন সরাবেন?', `"${listing.title}" আর কেউ দেখতে পাবে না।`, [
        { text: 'না', style: 'cancel' },
        {
          text: 'সরান',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove.mutateAsync(listing.id);
              toast.success('বিজ্ঞাপন সরানো হয়েছে');
            } catch (err) {
              toast.error('সরানো যায়নি', { body: getErrorMessage(err) });
            }
          },
        },
      ]);
    },
    [remove]
  );

  const listings = data?.listings ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} scrollable />

      {isLoading ? (
        <SkeletonList count={4} height={150} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <MyListingCard
              listing={item}
              index={index}
              onSell={setSellTarget}
              onRenew={handleRenew}
              onDelete={handleDelete}
              busy={busy}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState variant="error" onAction={() => refetch()} />
            ) : (
              <View>
                <EmptyState variant="noListings" title="এখানে কোনো বিজ্ঞাপন নেই" />
                <Button
                  title="বিজ্ঞাপন দিন"
                  variant="accent"
                  onPress={() => router.navigate('/(app)/(tabs)/post')}
                  style={styles.emptyButton}
                />
              </View>
            )
          }
        />
      )}

      <MarkAsSoldSheet listing={sellTarget} visible={!!sellTarget} onClose={() => setSellTarget(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  disabled: { opacity: 0.5 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', padding: 12, gap: 12 },
  thumb: { width: 84, height: 84, borderRadius: Radius.md },
  cardBody: { flex: 1, gap: 4 },
  title: { fontWeight: '600' },
  price: { fontSize: 17, lineHeight: 22 },
  reason: { flexDirection: 'row', gap: 6, marginHorizontal: 12, marginBottom: 8, padding: 8, borderRadius: Radius.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10 },
  actions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10 },
  emptyButton: { alignSelf: 'center', marginTop: -24, minWidth: 180 },
});
