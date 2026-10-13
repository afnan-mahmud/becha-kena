import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listingService } from '@/services/listing.service';
import { Listing } from '@/types/listing.types';
import { ListingCard, ListingCardSkeleton } from '@/components/listing/ListingCard';
import { CategoryScroll } from '@/components/common/CategoryScroll';
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner';
import { useTheme, FontFamilies } from '@/constants/theme';
import { useUiStore } from '@/store/ui.store';
import { LocationPicker } from '@/components/common/LocationPicker';

const ALL_BANGLADESH = 'সারা বাংলাদেশ';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Persisted default area (also editable from Settings → ডিফল্ট এলাকা)
  const division = useUiStore((s) => s.selectedDivision);
  const setDivision = useUiStore((s) => s.setSelectedDivision);
  const selectedDivision = division ?? ALL_BANGLADESH;
  const [showDivisionModal, setShowDivisionModal] = useState<boolean>(false);

  // TanStack Infinite Query for newest listings feed
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['listings', 'home', { division }],
    queryFn: ({ pageParam = 1 }) =>
      listingService.getListings({
        sort: 'newest',
        limit: 20,
        page: pageParam,
        division: division ?? undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  // Flatten paginated listings
  const listings: Listing[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.listings || []);
  }, [data]);

  const handleCategorySelect = (categoryValue?: string) => {
    if (categoryValue) {
      router.push({
        pathname: '/(app)/(tabs)/search',
        params: { category: categoryValue, t: String(Date.now()) },
      } as any);
    } else {
      router.push('/(app)/(tabs)/search' as any);
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Listing; index: number }) => (
      <ListingCard listing={item} variant="grid" index={index} />
    ),
    []
  );

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: isDark ? colors.background : '#F7F5F0',
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Main FlatList with 2-Column Grid */}
      <FlatList
        data={listings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        removeClippedSubviews
        windowSize={7}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Top Bar: Logo, Location Chip, Notifications */}
            <View style={styles.topBar}>
              <View style={styles.logoRow}>
                <Text style={[styles.logoText, { color: colors.primary }]}>
                  বেচা-কেনা
                </Text>
              </View>

              <View style={styles.topActions}>
                {/* Location Chip */}
                <Pressable
                  onPress={() => setShowDivisionModal(true)}
                  style={[
                    styles.locationChip,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#E7E3DA',
                    },
                  ]}
                >
                  <Ionicons
                    name="location-sharp"
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      { color: isDark ? colors.text : '#1B2420' },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedDivision}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={12}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {/* Notification Bell */}
                <Pressable
                  onPress={() =>
                    router.push('/(app)/settings/notifications' as any)
                  }
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? colors.border : '#E7E3DA',
                    },
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={isDark ? colors.text : '#1B2420'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Search Pill */}
            <Pressable
              onPress={() => router.push({ pathname: '/(app)/(tabs)/search', params: { focus: String(Date.now()) } } as any)}
              style={[
                styles.searchPill,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#E7E3DA',
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
              />
              <Text style={[styles.searchPillText, { color: colors.textMuted }]}>
                কী খুঁজছেন?
              </Text>
            </Pressable>

            {/* KYC Status Banner */}
            <View style={styles.bannerWrapper}>
              <KYCStatusBanner />
            </View>

            {/* Category Scroll */}
            <View style={styles.categorySection}>
              <CategoryScroll onSelect={handleCategorySelect} />
            </View>

            {/* Feed Section Title */}
            <View style={styles.feedHeaderRow}>
              <Text
                style={[
                  styles.feedTitle,
                  { color: isDark ? colors.text : '#1B2420' },
                ]}
              >
                সর্বশেষ বিজ্ঞাপন
              </Text>
              {division !== null && (
                <Pressable
                  onPress={() => setDivision(null)}
                >
                  <Text style={[styles.filterResetText, { color: colors.primary }]}>
                    সব এলাকা
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonGrid}>
              <View style={styles.skeletonRow}>
                <ListingCardSkeleton variant="grid" />
                <ListingCardSkeleton variant="grid" />
              </View>
              <View style={styles.skeletonRow}>
                <ListingCardSkeleton variant="grid" />
                <ListingCardSkeleton variant="grid" />
              </View>
            </View>
          ) : isError ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color="#DC2626"
                style={styles.emptyIcon}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? colors.text : '#1B2420' },
                ]}
              >
                বিজ্ঞাপন লোড করতে সমস্যা হয়েছে
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                ইন্টারনেট সংযোগ চেক করুন এবং পুনরায় চেষ্টা করুন
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.retryButtonText}>আবার চেষ্টা করুন</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? colors.text : '#1B2420' },
                ]}
              >
                এই এলাকায় এখনো কোনো বিজ্ঞাপন নেই
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                অন্যান্য বিভাগ বা এলাকা নির্বাচন করে দেখতে পারেন
              </Text>
              {division !== null && (
                <Pressable
                  onPress={() => setDivision(null)}
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.retryButtonText}>
                    সারা বাংলাদেশ দেখুন
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
      />

      {/* Location Picker (Prompt 17) — only the division matters for the home feed */}
      <LocationPicker
        visible={showDivisionModal}
        onClose={() => setShowDivisionModal(false)}
        value={division ? { division } : null}
        onSelect={(sel) => setDivision(sel?.division ?? null)}
        title="এলাকা বেছে নিন"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    paddingHorizontal: 8,
  },
  headerContainer: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    maxWidth: 150,
  },
  locationText: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchPillText: {
    fontSize: 14,
    fontFamily: FontFamilies.regular,
  },
  bannerWrapper: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  categorySection: {
    marginTop: 6,
    marginBottom: 4,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
  },
  filterResetText: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
  },
  skeletonGrid: {
    paddingHorizontal: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: FontFamilies.semiBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamilies.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontFamilies.semiBold,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerSpacer: {
    height: 16,
  },

});
