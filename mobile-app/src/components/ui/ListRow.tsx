import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export interface ListRowProps {
  /** Emoji or Ionicons name */
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Secondary text on the right (or under the label when `subtitle` is set) */
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Renders a Switch instead of a chevron */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  disabled?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
}

/** Row for settings / profile menus: chevron for navigation, Switch for toggles, red for destructive */
export function ListRow({
  emoji,
  icon,
  label,
  value,
  subtitle,
  onPress,
  destructive = false,
  switchValue,
  onSwitchChange,
  disabled = false,
  showChevron,
  isLast = false,
}: ListRowProps) {
  const { colors } = useTheme();
  const isSwitch = typeof switchValue === 'boolean';
  const labelColor = destructive ? colors.error : colors.text;
  const chevron = showChevron ?? (!!onPress && !isSwitch && !destructive);

  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        disabled && styles.disabled,
      ]}
    >
      {emoji ? (
        <AppText style={styles.emoji}>{emoji}</AppText>
      ) : icon ? (
        <Ionicons name={icon} size={20} color={destructive ? colors.error : colors.primary} style={styles.icon} />
      ) : null}
      <View style={styles.texts}>
        <AppText variant="body" style={{ color: labelColor, fontWeight: destructive ? '600' : '500' }}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="bodySmall" color={colors.textMuted} numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          trackColor={{ true: colors.primary, false: colors.borderDark }}
          thumbColor="#FFFFFF"
        />
      ) : chevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <PressableScale onPress={onPress} disabled={disabled} activeScale={0.99} accessibilityRole="button">
        {content}
      </PressableScale>
    );
  }
  return content;
}

/** White rounded group with a small heading above it */
export function ListSection({ title, children }: { title?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="caption" color={colors.textMuted} style={styles.sectionTitle}>
          {title}
        </AppText>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    minHeight: 54,
  },
  disabled: { opacity: 0.5 },
  emoji: { fontSize: 20, width: 26, textAlign: 'center' },
  icon: { width: 26, textAlign: 'center' },
  texts: { flex: 1 },
  value: { maxWidth: '45%' },
  section: { marginBottom: 20 },
  sectionTitle: {
    marginLeft: 20,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default ListRow;
