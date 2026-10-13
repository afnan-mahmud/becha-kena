import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import {
  DISTRICTS,
  DIVISIONS,
  DIVISION_COORDINATES,
  LocationSelection,
  THANAS,
} from '@/constants/locations';
import { AppText, BottomSheet } from '@/components/ui';

type Step = 'division' | 'district' | 'thana';

export interface LocationPickerContentProps {
  value?: LocationSelection | null;
  /** null = "সারা বাংলাদেশ" (reset) */
  onSelect: (selection: LocationSelection | null) => void;
  /** Show the "সারা বাংলাদেশ" reset row */
  allowAll?: boolean;
  /** Force division → district → thana (ad posting). Otherwise any level can be chosen. */
  requireThana?: boolean;
}

interface Row {
  key: string;
  label: string;
  /** "whole area" shortcut rows */
  isAll?: boolean;
}

/**
 * 3-step cascading picker বিভাগ → জেলা → থানা with search and breadcrumb (Prompt 17).
 * Rendered inline (e.g. inside the filter sheet) or via <LocationPicker /> as a bottom sheet.
 */
export function LocationPickerContent({ value, onSelect, allowAll = true, requireThana = false }: LocationPickerContentProps) {
  const { colors } = useTheme();
  const [division, setDivision] = useState<string | undefined>(value?.division);
  const [district, setDistrict] = useState<string | undefined>(value?.district);
  const [step, setStep] = useState<Step>(value?.district ? 'thana' : value?.division ? 'district' : 'division');
  const [query, setQuery] = useState('');

  const finish = (sel: Omit<LocationSelection, 'coordinates'>) => {
    onSelect({ ...sel, coordinates: sel.division ? DIVISION_COORDINATES[sel.division] : undefined });
  };

  const rows: Row[] = useMemo(() => {
    let base: Row[] = [];
    if (step === 'division') {
      base = DIVISIONS.map((d) => ({ key: d, label: d }));
    } else if (step === 'district' && division) {
      base = (DISTRICTS[division] ?? []).map((d) => ({ key: d, label: d }));
      if (!requireThana) base.unshift({ key: '__all', label: `পুরো ${division} বিভাগ`, isAll: true });
    } else if (step === 'thana' && district) {
      base = (THANAS[district] ?? []).map((t) => ({ key: t, label: t }));
      if (!requireThana) base.unshift({ key: '__all', label: `পুরো ${district} জেলা`, isAll: true });
    }
    const q = query.trim();
    return q ? base.filter((r) => r.isAll || r.label.includes(q)) : base;
  }, [step, division, district, query, requireThana]);

  const handlePress = (row: Row) => {
    setQuery('');
    if (step === 'division') {
      setDivision(row.key);
      setDistrict(undefined);
      setStep('district');
    } else if (step === 'district') {
      if (row.isAll) return finish({ division });
      setDistrict(row.key);
      // districts without a thana list can be picked directly
      if (!THANAS[row.key]?.length) return finish({ division, district: row.key });
      setStep('thana');
    } else {
      if (row.isAll) return finish({ division, district });
      finish({ division, district, thana: row.key });
    }
  };

  const goBack = () => {
    setQuery('');
    if (step === 'thana') setStep('district');
    else if (step === 'district') setStep('division');
  };

  const selectedKey = step === 'division' ? value?.division : step === 'district' ? value?.district : value?.thana;
  const stepTitle = step === 'division' ? 'বিভাগ বেছে নিন' : step === 'district' ? 'জেলা বেছে নিন' : 'থানা বেছে নিন';

  return (
    <View style={styles.container}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumbRow}>
        {step !== 'division' ? (
          <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn} accessibilityLabel="পেছনে">
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </Pressable>
        ) : null}
        <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={1} style={styles.flex}>
          {[division, step === 'thana' ? district : undefined].filter(Boolean).join(' › ') || 'বাংলাদেশ'}
          {step !== 'division' ? ' ›' : ''}{' '}
          <AppText variant="bodySmall" color={colors.primary} style={styles.bold}>
            {stepTitle}
          </AppText>
        </AppText>
      </View>

      {/* Search */}
      <View style={[styles.search, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="খুঁজুন…"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        ListHeaderComponent={
          allowAll && step === 'division' && !query ? (
            <Pressable
              onPress={() => onSelect(null)}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
              <AppText variant="body" style={[styles.flex, styles.bold]} color={colors.primary}>
                সারা বাংলাদেশ
              </AppText>
              {!value?.division ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = !item.isAll && item.key === selectedKey;
          return (
            <Pressable
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border },
                (pressed || selected) && { backgroundColor: colors.primarySoft },
              ]}
            >
              {item.isAll ? <Ionicons name="layers-outline" size={18} color={colors.primary} /> : null}
              <AppText
                variant="body"
                style={[styles.flex, (selected || item.isAll) && styles.bold]}
                color={selected || item.isAll ? colors.primary : colors.text}
              >
                {item.label}
              </AppText>
              {selected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : !item.isAll && step !== 'thana' ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <AppText variant="bodySmall" color={colors.textMuted} align="center" style={styles.empty}>
            কিছু পাওয়া যায়নি
          </AppText>
        }
      />
    </View>
  );
}

export interface LocationPickerProps extends LocationPickerContentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

/** Bottom-sheet version of the picker */
export function LocationPicker({ visible, onClose, onSelect, title = 'এলাকা বেছে নিন', ...rest }: LocationPickerProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} snapPoints={[0.75, 0.92]}>
      {visible ? (
        <LocationPickerContent
          {...rest}
          onSelect={(sel) => {
            onSelect(sel);
            onClose();
          }}
        />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  bold: { fontFamily: FontFamilies.semiBold, fontWeight: '600' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 4 },
  backBtn: { marginRight: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
    height: 42,
  },
  searchInput: { flex: 1, fontFamily: FontFamilies.regular, fontSize: 15, paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  empty: { padding: 24 },
});

export default LocationPicker;
