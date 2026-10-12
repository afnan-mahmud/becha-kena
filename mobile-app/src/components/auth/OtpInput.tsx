import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, Radius, Shadows, FontFamilies } from '@/constants/theme';
import { toBanglaDigits } from '@/lib/format';

export interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  error?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

interface SingleBoxProps {
  digit: string;
  index: number;
  isFocused: boolean;
  error?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  inputRef: (ref: TextInput | null) => void;
}

function OtpBox({
  digit,
  index,
  isFocused,
  error,
  isSuccess,
  disabled,
  autoFocus,
  onFocus,
  onBlur,
  onChangeText,
  onKeyPress,
  inputRef,
}: SingleBoxProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  // Box scale on focus animation
  useEffect(() => {
    scale.value = withTiming(isFocused ? 1.08 : 1, { duration: 150 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let borderColor: string = colors.border;
  let backgroundColor: string = colors.surface;

  if (isSuccess) {
    borderColor = colors.verified;
    backgroundColor = '#E7F7ED';
  } else if (error) {
    borderColor = colors.error;
    backgroundColor = '#FDECEC';
  } else if (isFocused) {
    borderColor = colors.primary;
    backgroundColor = colors.surface;
  }

  return (
    <Animated.View
      style={[
        styles.boxContainer,
        {
          borderColor,
          backgroundColor,
        },
        isFocused && Shadows.sm,
        animatedStyle,
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            color: isSuccess
              ? colors.verified
              : error
              ? colors.error
              : colors.text,
            fontFamily: FontFamilies.bold,
          },
        ]}
        value={digit ? toBanglaDigits(digit) : ''}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType="number-pad"
        maxLength={index === 0 ? 6 : 1}
        selectTextOnFocus
        editable={!disabled}
        autoFocus={autoFocus && index === 0}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
      />
    </Animated.View>
  );
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  error = false,
  isSuccess = false,
  disabled = false,
  autoFocus = true,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Horizontal shake animation on error
  const shakeOffset = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shakeOffset.value = withSequence(
        withTiming(-12, { duration: 45 }),
        withTiming(12, { duration: 45 }),
        withTiming(-10, { duration: 45 }),
        withTiming(10, { duration: 45 }),
        withTiming(-6, { duration: 45 }),
        withTiming(6, { duration: 45 }),
        withTiming(0, { duration: 45 })
      );
    }
  }, [error]);

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const handleChangeText = (text: string, index: number) => {
    // If full code is pasted or autofilled by SMS
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const truncated = cleaned.slice(0, length);
      onChange(truncated);
      const nextIndex = Math.min(truncated.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const currentDigits = value.split('');
    currentDigits[index] = cleaned;
    const newOtp = currentDigits.join('').slice(0, length);
    onChange(newOtp);

    // Auto-focus next box if a digit was entered
    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      const currentDigits = value.split('');
      if (!currentDigits[index] && index > 0) {
        // Current box is already empty, move to and clear previous box
        currentDigits[index - 1] = '';
        onChange(currentDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        currentDigits[index] = '';
        onChange(currentDigits.join(''));
      }
    }
  };

  return (
    <Animated.View style={[styles.container, shakeAnimatedStyle]}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || '';
        return (
          <OtpBox
            key={index}
            digit={digit}
            index={index}
            isFocused={focusedIndex === index}
            error={error}
            isSuccess={isSuccess}
            disabled={disabled}
            autoFocus={autoFocus}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            inputRef={(ref) => {
              inputRefs.current[index] = ref;
            }}
          />
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    gap: 8,
  },
  boxContainer: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 24,
    padding: 0,
  },
});
