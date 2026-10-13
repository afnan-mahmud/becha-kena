import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Radius, useTheme } from '@/constants/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export interface SegmentedTab<T extends string> {
  key: T;
  label: string;
  count?: number;
}

export interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Horizontal scroll for many tabs, otherwise equal-width segments */
  scrollable?: boolean;
}

/** Pill-style tab switcher used by My Listings and the public profile */
export function SegmentedTabs<T extends string>({ tabs, value, onChange, scrollable = false }: SegmentedTabsProps<T>) {
  const { colors } = useTheme();

  const items = tabs.map((tab) => {
    const active = tab.key === value;
    return (
      <PressableScale
        key={tab.key}
        onPress={() => onChange(tab.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={[
          styles.tab,
          !scrollable && styles.flex,
          {
            backgroundColor: active ? colors.primary : colors.surface,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        <AppText
          variant="bodySmall"
          numberOfLines={1}
          style={{ color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: active ? '600' : '500' }}
        >
          {tab.label}
          {typeof tab.count === 'number' ? ` (${tab.count})` : ''}
        </AppText>
      </PressableScale>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items}
      </ScrollView>
    );
  }
  return <View style={styles.row}>{items}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  scrollContent: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SegmentedTabs;
