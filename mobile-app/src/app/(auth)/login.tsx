import React, { useState } from 'react';
import type { ApiError } from '@/types/api.types';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, AppText, Button } from '@/components/ui';
import { useTheme, Spacing, Radius, Shadows, FontFamilies } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Live validation against ^01[3-9]\d{8}$
  const isValid = BD_PHONE_REGEX.test(phoneNumber);

  // Determine if we should show live validation error
  const isInvalidFormat =
    phoneNumber.length > 0 &&
    ((phoneNumber.length >= 2 && !phoneNumber.startsWith('01')) ||
      (phoneNumber.length >= 3 && !/^01[3-9]/.test(phoneNumber)) ||
      (phoneNumber.length === 11 && !isValid) ||
      (touched && phoneNumber.length > 0 && phoneNumber.length < 11));

  const hasError = isInvalidFormat || !!apiError;

  const handlePhoneChange = (text: string) => {
    // Keep only numbers
    let cleaned = text.replace(/\D/g, '');

    // If user pasted with 88 or +88 prefix
    if (cleaned.startsWith('8801')) {
      cleaned = cleaned.slice(2);
    }

    // Limit to max 11 digits
    cleaned = cleaned.slice(0, 11);

    setPhoneNumber(cleaned);
    setTouched(true);
    if (apiError) setApiError(null);
  };

  const handleSendOtp = async () => {
    if (!isValid || isLoading) return;

    // Trigger haptic feedback on button press
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback on unsupported platforms
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // API: POST /auth/request-otp with { phoneNumber }
      const res = await apiClient.post<{ expiresIn: number }>(
        ENDPOINTS.AUTH.REQUEST_OTP,
        { phoneNumber }
      );

      const expiresIn = res?.expiresIn || 180;

      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          phone: phoneNumber,
          expiresIn: String(expiresIn),
        },
      });
    } catch (e) {
      const err = e as Partial<ApiError> | undefined;
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Fallback
      }

      if (err?.status === 429 || err?.code === 'RATE_LIMIT_EXCEEDED') {
        setApiError('অনেকবার চেষ্টা করেছেন, এক ঘণ্টা পর আবার চেষ্টা করুন');
      } else if (err?.code === 'NETWORK_ERROR') {
        setApiError('ইন্টারনেট সংযোগ পরীক্ষা করুন');
      } else {
        setApiError(err?.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} keyboardAvoiding={false} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Navigation Row */}
          <View style={styles.navRow}>
            {router.canGoBack() && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          {/* Logo & Brand Header */}
          <View style={styles.header}>
            <View style={[styles.logoBadge, Shadows.sm]}>
              <View style={styles.flagGreenDot}>
                <View style={styles.flagRedDot} />
              </View>
              <AppText variant="caption" weight="700" color={colors.primary} style={styles.logoText}>
                বেচা-কেনা
              </AppText>
            </View>

            <AppText variant="heading1" style={styles.heading}>
              লগইন বা নতুন অ্যাকাউন্ট
            </AppText>

            <AppText
              variant="body"
              color={colors.textSecondary}
              style={styles.subtitle}
            >
              মোবাইল নম্বর দিন — আমরা ৬ ডিজিটের কোড পাঠাব। পাসওয়ার্ড লাগবে না।
            </AppText>
          </View>

          {/* Phone Input Card */}
          <View style={styles.form}>
            <AppText variant="bodySmall" weight="600" color={colors.text} style={styles.inputLabel}>
              মোবাইল নম্বর
            </AppText>

            <View
              style={[
                styles.phoneInputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: hasError
                    ? colors.error
                    : isFocused
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              {/* Fixed 🇧🇩 +88 Prefix */}
              <View style={[styles.prefixContainer, { backgroundColor: colors.backgroundSubtle }]}>
                <AppText style={styles.flagEmoji}>🇧🇩</AppText>
                <AppText variant="body" weight="600" color={colors.text} style={styles.prefixText}>
                  +88
                </AppText>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* National 11-digit Input */}
              <TextInput
                style={[
                  styles.phoneInput,
                  {
                    color: colors.text,
                    fontFamily: FontFamilies.medium,
                  },
                ]}
                placeholder="01XXXXXXXXX"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
                autoFocus={true}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                selectionColor={colors.primary}
              />

              {/* Valid checkmark indicator */}
              {isValid && (
                <View style={styles.validCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.verified} />
                </View>
              )}
            </View>

            {/* Error Message */}
            {hasError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <AppText variant="caption" color={colors.error} style={styles.errorText}>
                  {apiError || 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন'}
                </AppText>
              </View>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              title="OTP পাঠান"
              disabled={!isValid || isLoading}
              loading={isLoading}
              onPress={handleSendOtp}
              rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              style={styles.submitButton}
            />

            {/* Development Mode Tip */}
            {__DEV__ && (
              <View style={[styles.devTipBox, { backgroundColor: colors.secondarySoft }]}>
                <Ionicons name="terminal-outline" size={18} color={colors.warning} />
                <AppText variant="caption" weight="600" color={colors.text} style={styles.devTipText}>
                  💡 OTP ব্যাকএন্ড টার্মিনালে প্রিন্ট হয়
                </AppText>
              </View>
            )}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Footer Terms */}
          <View style={styles.footer}>
            <AppText
              variant="caption"
              align="center"
              color={colors.textMuted}
              style={styles.termsText}
            >
              চালিয়ে যাওয়ার মাধ্যমে আপনি আমাদের শর্তাবলিতে সম্মত হচ্ছেন
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  navRow: {
    height: 40,
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E3DA',
  },
  header: {
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    marginBottom: Spacing.md,
  },
  flagGreenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00704A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E63946',
  },
  logoText: {
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 26,
    lineHeight: 34,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 14,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 20,
  },
  prefixText: {
    fontSize: 16,
    lineHeight: 22,
  },
  divider: {
    width: 1,
    height: 24,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 18,
    letterSpacing: 1.5,
  },
  validCheck: {
    paddingRight: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
  },
  submitButton: {
    marginTop: Spacing.xl,
    borderRadius: Radius.lg,
  },
  devTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  devTipText: {
    fontSize: 13,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.xl,
  },
  footer: {
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
