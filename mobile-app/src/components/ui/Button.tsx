import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme, Radius, Typography } from '@/constants/theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const { colors } = useTheme();

  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    let backgroundColor: string = colors.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        backgroundColor = colors.primary;
        break;
      case 'accent':
        backgroundColor = colors.accent;
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderColor = colors.primary;
        borderWidth = 1.5;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
      case 'danger':
        backgroundColor = colors.error;
        break;
    }

    let height = 48;
    let paddingHorizontal = 18;

    switch (size) {
      case 'sm':
        height = 36;
        paddingHorizontal = 12;
        break;
      case 'md':
        height = 46;
        paddingHorizontal = 18;
        break;
      case 'lg':
        height = 54;
        paddingHorizontal = 24;
        break;
    }

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      height,
      paddingHorizontal,
      width: fullWidth ? '100%' : undefined,
      opacity: isDisabled ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'accent':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'sm':
        return 14;
      case 'md':
        return 16;
      case 'lg':
        return 18;
    }
  };

  const textColor = getTextColor();
  const fontSize = getTextSize();

  return (
    <TouchableOpacity
      style={[styles.base, getContainerStyle(), style]}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size={size === 'sm' ? 'small' : 'small'} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.iconMarginRight}>{leftIcon}</View> : null}
          {children || (
            <AppText
              variant="button"
              style={[
                styles.buttonText,
                { color: textColor, fontSize },
                textStyle,
              ]}
            >
              {title}
            </AppText>
          )}
          {rightIcon ? <View style={styles.iconMarginLeft}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconMarginRight: {
    marginRight: 8,
  },
  iconMarginLeft: {
    marginLeft: 8,
  },
});
