import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { getCategoryLabel, getConditionLabel } from '@/constants/categories';
import { formatLocation } from '@/constants/locations';
import { formatPrice, toBanglaDigits } from '@/lib/format';
import { getRecentSearches, saveRecentSearches } from '@/lib/storage';
import { SearchFilters, useListingsFeed } from '@/hooks/useListings';
import { ListingCard, ListingCardSkeleton } from '@/components/listing/ListingCard';
import { FilterBottomSheet, FilterSection } from '@/components/common/FilterBottomSheet';
import { AppText, EmptyState } from '@/components/ui';
import type { Listing } from '@/types/listing.types';

const SORT_LABELS: Record<NonNullable<SearchFilters['sort']>, string> = {
  newest: 'নতুন আগে',
  oldest: 'পুরনো আগে',
  price_low: 'দাম: কম → বেশি',
  price_high: 'দাম: বেশি → কম',
  nearby: 'আমার কাছাকাছি',
};

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; focus?: string; t?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query.trim(), 500);
  const [filters, setFilters] = useState<SearchFilters>(() => ({ sort: 'newest', category: params.category }));
  const [inputFocused, setInputFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [sheetSection, setSheetSection] = useState<FilterSection | null>(null);

  // Category coming from the home screen (render-time update when the params change)
  const paramsKey = `${params.category ?? ''}|${params.t ?? ''}`;
  const [lastParamsKey, setLastParamsKey] = useState(paramsKey);
  if (paramsKey !== lastParamsKey) {
    setLastParamsKey(paramsKey);
    if (params.category) setFilters((f) => ({ ...f, category: params.category }));
  }

  useEffect(() => {
    if (params.focus) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [params.focus]);

  useEffect(() => {
    getRecentSearches().then(setRecent).catch(() => {});
  }, []);

  const rememberSearch = useCallback((term: string) => {
    if (term.length < 2) return;
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 10);
      saveRecentSearches(next).catch(() => {});
      return next;
    });
  }, []);


  const activeFilters: SearchFilters = useMemo(
    () => ({ ...filters, search: debouncedQuery || undefined }),
    [filters, debouncedQuery]
  );

  // The query key changes with every filter → TanStack Query drops stale requests for us
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPlaceholderData,
  } = useListingsFeed(activeFilters);

  const listings = useMemo(() => data?.pages.flatMap((p) => p.listings) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const clearRecent = () => {
    setRecent([]);
    saveRecentSearches([]).catch(() => {});
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Listing; index: number }) => <ListingCard listing={item} variant="list" index={index} />,
    []
  );

  // ─── Filter chips ──────────────────────────────────────────────────────────
  const priceLabel =
    filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? `${filters.minPrice !== undefined ? formatPrice(filters.minPrice) : '৳০'}–${
          filters.maxPrice !== undefined ? formatPrice(filters.maxPrice) : '+'
        }`
      : undefined;

  const chips: { section: FilterSection; label: string; value?: string }[] = [
    { section: 'category', label: 'ক্যাটাগরি', value: filters.category ? getCategoryLabel(filters.category) : undefined },
    { section: 'price', label: 'দাম', value: priceLabel },
    {
      section: 'location',
      label: 'এলাকা',
      value: filters.sort === 'nearby' ? 'কাছাকাছি' : formatLocation(filters) || undefined,
    },
    { section: 'condition', label: 'অবস্থা', value: filters.condition ? getConditionLabel(filters.condition) : undefined },
    {
      section: 'sort',
      label: 'সাজান',
      value: filters.sort && filters.sort !== 'newest' ? SORT_LABELS[filters.sort] : undefined,
    },
  ];
  const hasActiveFilter = chips.some((c) => c.value);

  const showRecent = inputFocused && !query && recent.length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: inputFocused ? colors.primary : colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setInputFocused(true)}
            onBlur={() => {
              setInputFocused(false);
              rememberSearch(query.trim()); // save terms the user actually searched for
            }}
            onSubmitEditing={() => rememberSearch(query.trim())}
            placeholder="যেমন: iPhone 13, Yamaha FZ…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
            accessibilityLabel="বিজ্ঞাপন খুঁজুন"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="মুছুন">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map((chip) => {
          const active = !!chip.value;
          return (
            <Pressable
              key={chip.section}
              onPress={() => setSheetSection(chip.section)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText variant="bodySmall" numberOfLines={1} style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: active ? '600' : '500' }}>
                {chip.value ?? chip.label}
              </AppText>
              <Ionicons name="chevron-down" size={14} color={active ? '#FFFFFF' : colors.textMuted} />
            </Pressable>
          );
        })}
        {hasActiveFilter ? (
          <Pressable onPress={() => setFilters({ sort: 'newest' })} style={styles.clearAll} hitSlop={6}>
            <AppText variant="bodySmall" color={colors.accent} style={styles.bold}>
              সব মুছুন
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>

      {showRecent ? (
        <View style={styles.recentBox}>
          <View style={styles.recentHeader}>
            <AppText variant="bodySmall" color={colors.textSecondary} style={styles.bold}>
              সাম্প্রতিক খোঁজ
            </AppText>
            <Pressable onPress={clearRecent} hitSlop={8}>
              <AppText variant="bodySmall" color={colors.accent}>
                সব মুছুন
              </AppText>
            </Pressable>
          </View>
          <View style={styles.recentChips}>
            {recent.map((term) => (
              <Pressable
                key={term}
                onPress={() => {
                  setQuery(term);
                  inputRef.current?.blur();
                }}
                style={[styles.recentChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <AppText variant="bodySmall">{term}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          refreshControl={
            <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListHeaderComponent={
            !isLoading && !isError && listings.length > 0 ? (
              <View style={styles.countRow}>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {toBanglaDigits(total)}টি বিজ্ঞাপন পাওয়া গেছে
                </AppText>
                {isPlaceholderData ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            isLoading ? (
              <View>
                {[0, 1, 2, 3, 4].map((i) => (
                  <ListingCardSkeleton key={i} variant="list" />
                ))}
              </View>
            ) : isError ? (
              <EmptyState variant="error" onAction={() => refetch()} />
            ) : (
              <EmptyState
                variant="noResults"
                actionLabel={hasActiveFilter ? 'ফিল্টার মুছুন' : undefined}
                onAction={hasActiveFilter ? () => setFilters({ sort: 'newest' }) : undefined}
              />
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : <View style={styles.footer} />
          }
        />
      )}

      <FilterBottomSheet
        visible={sheetSection !== null}
        initialSection={sheetSection ?? undefined}
        onClose={() => setSheetSection(null)}
        value={filters}
        onApply={(f) => setFilters({ ...f, search: undefined })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bold: { fontFamily: FontFamilies.semiBold, fontWeight: '600' },
  searchRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontFamily: FontFamilies.regular, fontSize: 15, paddingVertical: 0 },
  chipsScroll: { flexGrow: 0 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: 200,
  },
  clearAll: { paddingHorizontal: 6 },
  recentBox: { padding: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  recentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  listContent: { paddingBottom: 24, flexGrow: 1 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footer: { paddingVertical: 20 },
});
