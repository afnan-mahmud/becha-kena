import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme, Radius, FontFamilies, Spacing } from '@/constants/theme';
import { AppText } from './AppText';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  characterCounter?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  characterCounter = false,
  maxLength,
  value,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);
  const currentLength = value ? value.length : 0;

  const getBorderColor = () => {
    if (hasError) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="bodySmall" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: getBorderColor(),
            borderWidth: isFocused || hasError ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <TextInput
          style={[
            styles.textInput,
            {
              color: colors.text,
              fontFamily: FontFamilies.regular,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.textMuted}
          value={value}
          maxLength={maxLength}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
      </View>

      <View style={styles.bottomRow}>
        {hasError ? (
          <AppText variant="caption" style={[styles.errorText, { color: colors.error }]}>
            {error}
          </AppText>
        ) : hint ? (
          <AppText variant="caption" style={[styles.hintText, { color: colors.textMuted }]}>
            {hint}
          </AppText>
        ) : (
          <View />
        )}

        {characterCounter && maxLength ? (
          <AppText variant="caption" style={[styles.counterText, { color: colors.textMuted }]}>
            {currentLength}/{maxLength}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  leftIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    includeFontPadding: false,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorText: {
    flex: 1,
  },
  hintText: {
    flex: 1,
  },
  counterText: {
    marginLeft: 8,
  },
});
