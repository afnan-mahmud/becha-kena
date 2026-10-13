import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTheme } from '@/constants/theme';
import { formatMonthYear, toBanglaDigits } from '@/lib/format';
import { STALE } from '@/lib/queryClient';
import { userService } from '@/services/user.service';
import { listingService } from '@/services/listing.service';
import { useAuthStore } from '@/store/auth.store';
import { useRequireVerified } from '@/hooks/useRequireVerified';
import { ListingCard, ListingCardSkeleton } from '@/components/listing/ListingCard';
import { ReviewsList } from '@/components/listing/ReviewsList';
import { ReportModal } from '@/components/common/ReportModal';
import { AppText, Avatar, EmptyState, SegmentedTabs, SkeletonProfile, StarRating } from '@/components/ui';
import type { Listing } from '@/types/listing.types';

type Tab = 'listings' | 'reviews';

/** Public profile (Prompt 26): header, active ads grid, reviews */
export default function PublicProfileScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const myId = useAuthStore((s) => s.user?.id);
  const guard = useRequireVerified();
  const [tab, setTab] = useState<Tab>(initialTab === 'reviews' ? 'reviews' : 'listings');
  const [reportOpen, setReportOpen] = useState(false);
  const isMe = id === myId;

  const userQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
    enabled: !!id,
    staleTime: STALE.profile,
  });

  // Only ACTIVE ads are returned by GET /listings
  const listingsQuery = useInfiniteQuery({
    queryKey: ['listings', { sellerId: id }],
    queryFn: ({ pageParam }) => listingService.getListings({ sellerId: id, page: pageParam, limit: 20, sort: 'newest' }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!id,
    staleTime: STALE.feed,
  });

  const listings = useMemo(() => listingsQuery.data?.pages.flatMap((p) => p.listings) ?? [], [listingsQuery.data]);
  const listingTotal = listingsQuery.data?.pages[0]?.total;
  const user = userQuery.data;

  const renderItem = useCallback(
    ({ item, index }: { item: Listing; index: number }) => <ListingCard listing={item} variant="grid" index={index} />,
    []
  );

  const header = (
    <View>
      {/* Green patterned cover */}
      <View style={[styles.cover, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
        <View style={[styles.pattern, styles.pattern1]} />
        <View style={[styles.pattern, styles.pattern2]} />
        <View style={[styles.pattern, styles.pattern3]} />
        <View style={styles.coverBar}>
          <Pressable onPress={() => router.back()} style={styles.coverBtn} accessibilityLabel="ফিরে যান">
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          {!isMe && user ? (
            <Pressable
              onPress={() => guard('report') && setReportOpen(true)}
              style={[styles.coverBtn, styles.reportBtn]}
              accessibilityLabel="রিপোর্ট করুন"
            >
              <Ionicons name="flag-outline" size={16} color="#FFFFFF" />
              <AppText variant="caption" style={styles.reportText}>
                রিপোর্ট
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {userQuery.isLoading ? (
        <SkeletonProfile />
      ) : user ? (
        <View style={styles.profile}>
          <Avatar name={user.displayName} size={92} verified={user.isVerified} borderColor={colors.surface} style={styles.avatar} />
          <AppText variant="heading2" align="center">
            {user.displayName}
          </AppText>
          {user.isVerified ? (
            <View style={[styles.verifiedPill, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="shield-checkmark" size={14} color={colors.verified} />
              <AppText variant="caption" color={colors.verified} style={styles.bold}>
                NID ভেরিফাইড
              </AppText>
            </View>
          ) : null}
          {user.verifiedName ? (
            <AppText variant="bodySmall" color={colors.textSecondary}>
              আইনগত নাম: {user.verifiedName}
            </AppText>
          ) : null}
          <View style={styles.statsRow}>
            {user.totalReviews > 0 ? (
              <View style={styles.inline}>
                <StarRating value={user.averageRating} readOnly allowHalf size={15} />
                <AppText variant="bodySmall" style={styles.bold}>
                  {toBanglaDigits(user.averageRating.toFixed(1))}
                </AppText>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  ({toBanglaDigits(user.totalReviews)} রিভিউ)
                </AppText>
              </View>
            ) : (
              <AppText variant="bodySmall" color={colors.textMuted}>
                এখনো রিভিউ নেই
              </AppText>
            )}
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            সদস্য: {formatMonthYear(user.createdAt)}
          </AppText>
        </View>
      ) : (
        <EmptyState variant="error" title="প্রোফাইল লোড করা যায়নি" onAction={() => userQuery.refetch()} compact />
      )}

      <SegmentedTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'listings', label: 'বিজ্ঞাপন', count: listingTotal },
          { key: 'reviews', label: 'রিভিউ', count: user?.totalReviews },
        ]}
      />
    </View>
  );

  const refresh = () => {
    userQuery.refetch();
    listingsQuery.refetch();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {tab === 'reviews' && id ? (
        <ReviewsList userId={id} header={header} />
      ) : (
        <FlatList
          data={listings}
          numColumns={2}
          keyExtractor={(l) => l.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          onEndReached={() => listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage && listingsQuery.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={listingsQuery.isRefetching && !listingsQuery.isFetchingNextPage}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            listingsQuery.isLoading ? (
              <View style={styles.skeletonRow}>
                <ListingCardSkeleton variant="grid" />
                <ListingCardSkeleton variant="grid" />
              </View>
            ) : listingsQuery.isError ? (
              <EmptyState variant="error" compact onAction={() => listingsQuery.refetch()} />
            ) : (
              <EmptyState variant="noListings" compact title="কোনো সক্রিয় বিজ্ঞাপন নেই" />
            )
          }
          ListFooterComponent={
            listingsQuery.isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : <View style={styles.footer} />
          }
        />
      )}

      {user ? (
        <ReportModal
          targetType="User"
          targetId={user.id}
          targetName={user.displayName}
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bold: { fontWeight: '600' },
  cover: { height: 150, overflow: 'hidden' },
  pattern: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  pattern1: { width: 180, height: 180, top: -60, right: -40 },
  pattern2: { width: 120, height: 120, bottom: -50, left: 30, backgroundColor: 'rgba(244,180,0,0.18)' },
  pattern3: { width: 60, height: 60, top: 40, left: -20, backgroundColor: 'rgba(230,57,70,0.25)' },
  coverBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  coverBtn: {
    height: 38,
    minWidth: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBtn: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  reportText: { color: '#FFFFFF', fontWeight: '600' },
  profile: { alignItems: 'center', paddingHorizontal: 16, gap: 4, marginTop: -46 },
  avatar: { marginBottom: 8 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statsRow: { marginTop: 6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  column: { paddingHorizontal: 8 },
  listContent: { flexGrow: 1 },
  skeletonRow: { flexDirection: 'row', paddingHorizontal: 8 },
  footer: { paddingVertical: 24 },
});
