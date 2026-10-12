import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewProps,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { useTheme, Radius, Shadows, Spacing } from '@/constants/theme';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: keyof typeof Spacing | number;
  onPress?: (event: GestureResponderEvent) => void;
  children?: React.ReactNode;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  variant = 'outlined',
  padding = 16,
  onPress,
  children,
  style,
  activeOpacity = 0.85,
  ...props
}) => {
  const { colors } = useTheme();

  const paddingValue = typeof padding === 'number' ? padding : Spacing[padding];

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          ...Shadows.sm,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.backgroundSubtle,
        };
    }
  };

  const containerStyle: ViewStyle = {
    padding: paddingValue,
    borderRadius: Radius.lg,
    ...getVariantStyle(),
  };

  if (onPress) {
    const { onBlur, onFocus, ...touchableProps } = props;
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
};
