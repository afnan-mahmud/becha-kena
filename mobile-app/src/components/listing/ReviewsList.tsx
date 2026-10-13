import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Radius, useTheme } from '@/constants/theme';
import { getReviewer, getReviewListing, reviewService } from '@/services/review.service';
import { formatDate, toBanglaDigits } from '@/lib/format';
import { STALE } from '@/lib/queryClient';
import { AppText, Avatar, Button, EmptyState, StarRating } from '@/components/ui';
import type { Review } from '@/types/listing.types';

export function useUserReviews(userId?: string) {
  return useInfiniteQuery({
    queryKey: ['reviews', userId],
    queryFn: ({ pageParam }) => reviewService.getUserReviews(userId!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!userId,
    staleTime: STALE.profile,
  });
}

/** Big average + stars + count + 5★…1★ distribution (from the loaded reviews) */
export function ReviewsSummary({ average, total, reviews }: { average: number; total: number; reviews: Review[] }) {
  const { colors } = useTheme();
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const i = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[i]++;
    });
    return counts;
  }, [reviews]);
  const max = Math.max(1, ...distribution);

  return (
    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.summaryLeft}>
        <AppText style={[styles.bigRating, { color: colors.text }]}>{toBanglaDigits(average.toFixed(1))}</AppText>
        <StarRating value={average} readOnly allowHalf size={16} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.count}>
          {toBanglaDigits(total)}টি রিভিউ
        </AppText>
      </View>
      <View style={styles.bars}>
        {[5, 4, 3, 2, 1].map((star) => (
          <View key={star} style={styles.barRow}>
            <AppText variant="caption" color={colors.textSecondary} style={styles.barLabel}>
              {toBanglaDigits(star)}★
            </AppText>
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.barFill, { width: `${(distribution[star - 1] / max) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export const ReviewItem = React.memo(function ReviewItem({ review }: { review: Review }) {
  const { colors } = useTheme();
  const reviewer = getReviewer(review);
  const listing = getReviewListing(review);
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <Avatar name={reviewer?.displayName} size={36} verified={reviewer?.isVerified} />
        <View style={styles.flex}>
          <AppText variant="bodySmall" style={styles.bold} numberOfLines={1}>
            {reviewer?.displayName ?? 'ব্যবহারকারী'}
          </AppText>
          <View style={styles.starsRow}>
            <StarRating value={review.rating} readOnly size={13} />
            <AppText variant="caption" color={colors.textMuted}>
              {formatDate(review.createdAt, 'd MMM yyyy')}
            </AppText>
          </View>
        </View>
      </View>
      <AppText variant="body" style={styles.text}>
        {review.reviewText}
      </AppText>
      {listing ? (
        <Pressable onPress={() => router.push(`/(app)/listing/${listing.id}`)} hitSlop={4}>
          <AppText variant="caption" color={colors.primary}>
            🛍️ কেনা পণ্য: {listing.title}
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
});

export interface ReviewsListProps {
  userId: string;
  /** Preview mode: show the first N reviews + "সব রিভিউ দেখুন" */
  limit?: number;
  onSeeAll?: () => void;
  /** Rendered above the summary (e.g. the public profile header + tabs) */
  header?: React.ReactElement;
}

/** Reviews of a user (Prompt 35) — GET /reviews/user/:userId with infinite scroll */
export function ReviewsList({ userId, limit, onSeeAll, header }: ReviewsListProps) {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserReviews(userId);

  const reviews = useMemo(() => data?.pages.flatMap((p) => p.reviews) ?? [], [data]);
  const first = data?.pages[0];

  const summary =
    first && first.total > 0 ? (
      <ReviewsSummary average={first.averageRating ?? 0} total={first.total} reviews={reviews} />
    ) : null;

  const empty = isLoading ? (
    <ActivityIndicator color={colors.primary} style={styles.loader} />
  ) : isError ? (
    <EmptyState variant="error" compact onAction={() => refetch()} />
  ) : (
    <EmptyState variant="noReviews" compact />
  );

  // Preview: plain views (safe inside a ScrollView)
  if (limit) {
    const visible = reviews.slice(0, limit);
    return (
      <View>
        {summary}
        {visible.length ? visible.map((r) => <ReviewItem key={r.id} review={r} />) : empty}
        {first && first.total > limit && onSeeAll ? (
          <Button title="সব রিভিউ দেখুন" variant="ghost" onPress={onSeeAll} />
        ) : null}
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <ReviewItem review={item} />}
      ListHeaderComponent={
        <View>
          {header}
          <View style={styles.headerPad}>{summary}</View>
        </View>
      }
      ListEmptyComponent={empty}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : hasNextPage ? (
          <Button title="আরো দেখুন" variant="ghost" onPress={() => fetchNextPage()} />
        ) : (
          <View style={styles.footerSpace} />
        )
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  loader: { marginVertical: 24 },
  headerPad: { paddingHorizontal: 16 },
  listContent: { flexGrow: 1 },
  footerSpace: { height: 32 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginVertical: 12,
  },
  summaryLeft: { alignItems: 'center', minWidth: 90 },
  bigRating: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
  count: { marginTop: 4 },
  bars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 24 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: '#F4B400' },
  item: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { lineHeight: 22 },
});

export default ReviewsList;
