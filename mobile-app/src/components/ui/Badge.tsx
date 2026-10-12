import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme, Radius, Spacing } from '@/constants/theme';
import { AppText } from './AppText';

export type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'green':
        return {
          bg: colors.successSoft,
          text: colors.success,
        };
      case 'yellow':
        return {
          bg: colors.warningSoft,
          text: colors.warning,
        };
      case 'red':
        return {
          bg: colors.errorSoft,
          text: colors.error,
        };
      case 'blue':
        return {
          bg: colors.infoSoft,
          text: colors.info,
        };
      case 'neutral':
      default:
        return {
          bg: colors.backgroundSubtle,
          text: colors.textSecondary,
        };
    }
  };

  const { bg, text } = getColors();

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.iconMargin}>{icon}</View> : null}
      {children || (
        <AppText
          variant={isSmall ? 'caption' : 'bodySmall'}
          style={[
            styles.text,
            { color: text, fontSize: isSmall ? 11 : 13 },
            textStyle,
          ]}
        >
          {label}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
  },
  iconMargin: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
