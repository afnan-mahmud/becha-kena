import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { CATEGORIES, CONDITIONS } from '@/constants/categories';
import { formatLocation } from '@/constants/locations';
import { formatPrice } from '@/lib/format';
import { useLocation } from '@/hooks/useLocation';
import { NEARBY_RADIUS_METERS, SearchFilters } from '@/hooks/useListings';
import { AppText, BottomSheet, Button, Chip } from '@/components/ui';
import { LocationPickerContent } from './LocationPicker';
import type { ListingCondition } from '@/types/listing.types';

export type FilterSection = 'category' | 'price' | 'condition' | 'sort' | 'location';

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  value: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  initialSection?: FilterSection;
}

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: '৳০-৫,০০০', min: 0, max: 5000 },
  { label: '৳৫,০০০-২০,০০০', min: 5000, max: 20000 },
  { label: '৳২০,০০০-১,০০,০০০', min: 20000, max: 100000 },
  { label: '৳১,০০,০০০+', min: 100000 },
];

const SORT_OPTIONS: { value: NonNullable<SearchFilters['sort']>; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'newest', label: 'নতুন আগে', icon: 'time-outline' },
  { value: 'price_low', label: 'দাম কম থেকে বেশি', icon: 'trending-up-outline' },
  { value: 'price_high', label: 'দাম বেশি থেকে কম', icon: 'trending-down-outline' },
  { value: 'oldest', label: 'পুরনো আগে', icon: 'hourglass-outline' },
  { value: 'nearby', label: 'আমার কাছাকাছি', icon: 'navigate-outline' },
];

const toNumber = (text: string): number | undefined => {
  // accept Bangla digits too
  const ascii = text.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/[^\d]/g, '');
  return ascii ? Number(ascii) : undefined;
};

/**
 * Search filters in a bottom sheet (Prompt 18): category, price, condition, sort
 * (incl. "near me"), and area via the embedded LocationPicker.
 */
export function FilterBottomSheet({ visible, onClose, value, onApply, initialSection }: FilterBottomSheetProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<SearchFilters>(value);
  const [pickingLocation, setPickingLocation] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<FilterSection, number>>>({});
  const location = useLocation();

  // Fresh draft every time the sheet opens
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(value);
      setPickingLocation(initialSection === 'location');
    }
  }

  const update = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));

  // Jump to the section whose chip opened the sheet
  const handleSectionLayout = (section: FilterSection, y: number) => {
    sectionY.current[section] = y;
    if (section === initialSection) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false });
    }
  };

  const chooseSort = async (sort: NonNullable<SearchFilters['sort']>) => {
    if (sort !== 'nearby') {
      update({ sort, lat: undefined, lng: undefined, radius: undefined });
      return;
    }
    const result = await location.request();
    if (result) {
      update({
        sort: 'nearby',
        lat: result.coords.latitude,
        lng: result.coords.longitude,
        radius: NEARBY_RADIUS_METERS,
      });
    }
  };

  const reset = () => setDraft({ search: value.search });

  const apply = () => {
    const { minPrice, maxPrice } = draft;
    // swap a reversed range instead of showing an error
    const fixed =
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? { ...draft, minPrice: maxPrice, maxPrice: minPrice }
        : draft;
    onApply(fixed);
    onClose();
  };

  const sectionTitle = (text: string) => (
    <AppText variant="heading3" style={styles.sectionTitle}>
      {text}
    </AppText>
  );

  const locationLabel = formatLocation(draft) || 'সারা বাংলাদেশ';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={pickingLocation ? 'এলাকা' : 'ফিল্টার'}
      snapPoints={[0.6, 0.9]}
      initialSnap={1}
      footer={
        pickingLocation ? (
          <Button title="ফিরে যান" variant="outline" onPress={() => setPickingLocation(false)} fullWidth />
        ) : (
          <View style={styles.footer}>
            <Button title="রিসেট" variant="outline" onPress={reset} style={styles.footerBtn} />
            <Button title="ফলাফল দেখুন" onPress={apply} style={[styles.footerBtn, styles.footerPrimary]} />
          </View>
        )
      }
    >
      {pickingLocation ? (
        <LocationPickerContent
          value={draft}
          onSelect={(sel) => {
            update({
              division: sel?.division,
              district: sel?.district,
              thana: sel?.thana,
              // choosing an area turns "near me" off
              ...(draft.sort === 'nearby' ? { sort: 'newest', lat: undefined, lng: undefined, radius: undefined } : {}),
            });
            setPickingLocation(false);
          }}
        />
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* 1. Category */}
          <View onLayout={(e) => handleSectionLayout('category', e.nativeEvent.layout.y)}>
            {sectionTitle('ক্যাটাগরি')}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => {
                const selected = draft.category === c.value;
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => update({ category: selected ? undefined : c.value })}
                    style={[
                      styles.categoryTile,
                      {
                        backgroundColor: selected ? colors.primarySoft : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    accessibilityState={{ selected }}
                  >
                    <AppText style={styles.categoryEmoji}>{c.emoji}</AppText>
                    <AppText
                      variant="caption"
                      align="center"
                      numberOfLines={2}
                      color={selected ? colors.primary : colors.text}
                      style={selected ? styles.bold : undefined}
                    >
                      {c.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 2. Price */}
          <View onLayout={(e) => handleSectionLayout('price', e.nativeEvent.layout.y)}>
            {sectionTitle('দাম')}
            <View style={styles.priceRow}>
              {(['minPrice', 'maxPrice'] as const).map((key) => (
                <View key={key} style={[styles.priceInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <AppText variant="bodySmall" color={colors.textMuted}>
                    ৳
                  </AppText>
                  <TextInput
                    value={draft[key] !== undefined ? String(draft[key]) : ''}
                    onChangeText={(t) => update({ [key]: toNumber(t) })}
                    placeholder={key === 'minPrice' ? 'সর্বনিম্ন' : 'সর্বোচ্চ'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={[styles.priceText, { color: colors.text }]}
                    maxLength={9}
                  />
                </View>
              ))}
            </View>
            <View style={styles.wrap}>
              {PRICE_PRESETS.map((p) => (
                <Chip
                  key={p.label}
                  label={p.label}
                  selected={draft.minPrice === p.min && draft.maxPrice === p.max}
                  onPress={() => update({ minPrice: p.min, maxPrice: p.max })}
                />
              ))}
            </View>
            {draft.minPrice !== undefined || draft.maxPrice !== undefined ? (
              <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>
                {draft.minPrice !== undefined ? formatPrice(draft.minPrice) : '৳০'} —{' '}
                {draft.maxPrice !== undefined ? formatPrice(draft.maxPrice) : 'যেকোনো'}
              </AppText>
            ) : null}
          </View>

          {/* 3. Condition */}
          <View onLayout={(e) => handleSectionLayout('condition', e.nativeEvent.layout.y)}>
            {sectionTitle('অবস্থা')}
            <View style={styles.wrap}>
              <Chip label="সব" selected={!draft.condition} onPress={() => update({ condition: undefined })} />
              {CONDITIONS.map((c) => (
                <Chip
                  key={c.value}
                  label={c.label}
                  selected={draft.condition === c.value}
                  onPress={() => update({ condition: c.value as ListingCondition })}
                />
              ))}
            </View>
          </View>

          {/* 4. Sort */}
          <View onLayout={(e) => handleSectionLayout('sort', e.nativeEvent.layout.y)}>
            {sectionTitle('সাজান')}
            {SORT_OPTIONS.map((o) => {
              const selected = (draft.sort ?? 'newest') === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => chooseSort(o.value)}
                  style={[styles.radioRow, { borderBottomColor: colors.border }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons name={o.icon} size={18} color={colors.textSecondary} />
                  <AppText variant="body" style={styles.flex}>
                    {o.label}
                  </AppText>
                  {o.value === 'nearby' && location.loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}
            {location.error ? (
              <AppText variant="caption" color={colors.error} style={styles.hint}>
                {location.error}
              </AppText>
            ) : draft.sort === 'nearby' ? (
              <AppText variant="caption" color={colors.textSecondary} style={styles.hint}>
                আপনার আশেপাশের ১০ কিমির বিজ্ঞাপন, কাছের গুলো আগে
              </AppText>
            ) : null}
          </View>

          {/* 5. Area */}
          <View onLayout={(e) => handleSectionLayout('location', e.nativeEvent.layout.y)}>
            {sectionTitle('এলাকা')}
            <Pressable
              onPress={() => setPickingLocation(true)}
              style={[styles.locationRow, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <AppText variant="body" style={styles.flex} numberOfLines={1}>
                {draft.sort === 'nearby' ? 'আমার কাছাকাছি' : locationLabel}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: FontFamilies.semiBold, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { marginTop: 16, marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryTile: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  categoryEmoji: { fontSize: 22, lineHeight: 28, marginBottom: 2 },
  priceRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  priceInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 6,
  },
  priceText: { flex: 1, fontFamily: FontFamilies.regular, fontSize: 15, paddingVertical: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { marginTop: 8 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  footer: { flexDirection: 'row', gap: 10 },
  footerBtn: { flex: 1 },
  footerPrimary: { flex: 2 },
});

export default FilterBottomSheet;
