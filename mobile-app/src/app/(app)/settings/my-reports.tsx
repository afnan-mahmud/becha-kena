import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Radius, useTheme } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { reportService } from '@/services/report.service';
import { getReasonLabel } from '@/components/common/ReportModal';
import { AppText, Badge, EmptyState, SkeletonList } from '@/components/ui';
import type { Report, ReportStatus } from '@/types/listing.types';

const STATUS: Record<ReportStatus, { label: string; variant: 'yellow' | 'blue' | 'green' | 'neutral' }> = {
  pending: { label: 'অপেক্ষমাণ', variant: 'yellow' },
  reviewed: { label: 'দেখা হয়েছে', variant: 'blue' },
  resolved: { label: 'ব্যবস্থা নেওয়া হয়েছে', variant: 'green' },
  dismissed: { label: 'বাতিল', variant: 'neutral' },
};

function ReportCard({ report, index }: { report: Report; index: number }) {
  const { colors } = useTheme();
  const isListing = report.targetType === 'Listing';
  const targetName = report.targetId ? (isListing ? report.targetId.title : report.targetId.displayName) : null;
  const status = STATUS[report.status] ?? STATUS.pending;

  const open = () => {
    if (!report.targetId) return;
    router.push(isListing ? `/(app)/listing/${report.targetId.id}` : `/(app)/user/${report.targetId.id}`);
  };

  return (
    <Animated.View entering={index < 10 ? FadeInDown.delay(index * 40).duration(250) : undefined}>
      <Pressable
        onPress={open}
        disabled={!report.targetId}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? colors.backgroundSubtle : colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.top}>
          <View style={[styles.icon, { backgroundColor: isListing ? colors.infoSoft : colors.accentSoft }]}>
            <Ionicons name={isListing ? 'pricetag-outline' : 'person-outline'} size={18} color={isListing ? colors.info : colors.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" color={colors.textMuted}>
              {isListing ? 'বিজ্ঞাপন' : 'ব্যবহারকারী'}
            </AppText>
            <AppText variant="body" numberOfLines={1} style={styles.bold} color={targetName ? colors.text : colors.textMuted}>
              {targetName ?? 'মুছে ফেলা হয়েছে'}
            </AppText>
          </View>
          <Badge size="sm" label={status.label} variant={status.variant} />
        </View>

        <AppText variant="bodySmall" style={styles.bold}>
          কারণ: {getReasonLabel(report.reason)}
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={3}>
          {report.description}
        </AppText>

        {report.resolution ? (
          <View style={[styles.resolution, { backgroundColor: colors.primarySoft }]}>
            <AppText variant="caption" color={colors.primary} style={styles.bold}>
              টিমের সিদ্ধান্ত: {report.resolution}
            </AppText>
          </View>
        ) : null}

        <AppText variant="caption" color={colors.textMuted}>
          জমা: {formatDate(report.createdAt, 'd MMM yyyy, h:mm a')} • #{report.id.slice(-6).toUpperCase()}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

/** My reports (Prompt 40) — GET /reports/my */
export default function MyReportsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['my-reports'],
    queryFn: ({ pageParam }) => reportService.getMyReports(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const reports = useMemo(() => data?.pages.flatMap((p) => p.reports) ?? [], [data]);

  if (isLoading) return <SkeletonList count={4} height={140} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={reports}
      keyExtractor={(r) => r.id}
      renderItem={({ item, index }) => <ReportCard report={item} index={index} />}
      contentContainerStyle={styles.list}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
      }
      ListEmptyComponent={
        isError ? (
          <EmptyState variant="error" onAction={() => refetch()} />
        ) : (
          <EmptyState
            variant="noReports"
            subtitle="কোনো বিজ্ঞাপন বা ব্যবহারকারী নিয়ে সমস্যা হলে তাঁদের পেজের 🚩 বাটন থেকে রিপোর্ট করুন।"
          />
        )
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: 14, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resolution: { padding: 8, borderRadius: Radius.sm },
  footer: { marginVertical: 16 },
});
