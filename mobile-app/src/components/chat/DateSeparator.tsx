import React from 'react';
import { StyleSheet, View } from 'react-native';
import { isToday, isYesterday } from 'date-fns';
import { useTheme } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { AppText } from '@/components/ui';

export const dateSeparatorLabel = (date: string | Date) => {
  const d = new Date(date);
  if (isToday(d)) return 'আজ';
  if (isYesterday(d)) return 'গতকাল';
  return formatDate(d, 'd MMMM yyyy');
};

/** Centered day pill between messages (Prompt 31) */
export const DateSeparator = React.memo(function DateSeparator({ date }: { date: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}>
        <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
          {dateSeparatorLabel(date)}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { alignItems: 'center', marginVertical: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  text: { fontWeight: '600' },
});

export default DateSeparator;
