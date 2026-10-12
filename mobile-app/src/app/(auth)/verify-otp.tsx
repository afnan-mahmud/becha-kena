import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, AppText, Button } from '@/components/ui';
import { OtpInput } from '@/components/auth/OtpInput';
import { useTheme, Spacing, Radius, FontFamilies } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { AuthResponse } from '@/types/user.types';
import { toBanglaDigits } from '@/lib/format';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; expiresIn?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const login = useAuthStore((state) => state.login);

  const phone = params.phone || '';
  const initialExpiresIn = params.expiresIn ? parseInt(params.expiresIn, 10) : 180;

  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(initialExpiresIn || 180);
  const [resendCount, setResendCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format phone display with +88 prefix
  const formattedPhone = phone.startsWith('+88')
    ? phone
    : `+88 ${phone}`;

  // Countdown timer from expiresIn (180s) down to 0
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Convert seconds to Bangla countdown representation (৩:০০ -> ০:০০)
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const sStr = s < 10 ? `0${s}` : `${s}`;
    return `${toBanglaDigits(m)}:${toBanglaDigits(sStr)}`;
  };

  const handleOtpChange = (newCode: string) => {
    setOtpCode(newCode);
    if (hasError) {
      setHasError(false);
      setErrorMessage(null);
    }

    // Auto-submit when exactly 6 digits are entered
    if (newCode.length === 6 && !isLoading && !isSuccess) {
      handleVerify(newCode);
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6 || isLoading || isSuccess) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      // API: POST /auth/verify-otp with { phoneNumber, otpCode: string }
      const authData = await apiClient.post<AuthResponse>(
        ENDPOINTS.AUTH.VERIFY_OTP,
        {
          phoneNumber: phone,
          otpCode: String(codeToVerify),
        }
      );

      // Success animation: turns boxes green
      setIsSuccess(true);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Fallback
      }

      // Save tokens and user in Zustand Store
      await login(authData);

      // Brief delay to let the user see the green success state
      setTimeout(() => {
        router.replace('/(app)/(tabs)/home');

        // If user is not yet verified with NID, show invite alert
        if (!authData.user.isVerified) {
          Alert.alert(
            'স্বাগতম!',
            'আপনার অ্যাকাউন্ট সক্রিয় হয়েছে। ১০০% নিরাপদ লেনদেন ও বিক্রির সুবিধার জন্য আপনার জাতীয় পরিচয়পত্র (NID) দিয়ে যাচাই সম্পন্ন করুন।',
            [
              {
                text: 'পরে করব',
                style: 'cancel',
              },
              {
                text: 'এখনই যাচাই করুন',
                onPress: () => router.push('/(app)/kyc'),
              },
            ]
          );
        }
      }, 500);
    } catch (err: any) {
      setHasError(true);
      setIsSuccess(false);

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Fallback
      }

      const errCode = err?.code;

      if (errCode === 'INVALID_OTP') {
        setErrorMessage('ভুল কোড');
        setOtpCode(''); // Clear input on invalid code
      } else if (errCode === 'OTP_EXPIRED') {
        setErrorMessage('কোডের মেয়াদ শেষ, নতুন কোড নিন');
        setCountdown(0);
      } else if (errCode === 'OTP_ATTEMPTS_EXCEEDED') {
        setErrorMessage('অনেকবার ভুল হয়েছে, নতুন কোড নিন');
        setCountdown(0); // enable resend immediately
      } else if (errCode === 'ACCOUNT_SUSPENDED' || err?.status === 403) {
        setErrorMessage('আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে');
      } else if (errCode === 'NETWORK_ERROR') {
        setErrorMessage('ইন্টারনেট সংযোগ পরীক্ষা করুন');
      } else {
        setErrorMessage(err?.message || 'ওটিপি যাচাই ব্যর্থ হয়েছে');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount >= 3 || isResending) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }

    setIsResending(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      // POST /auth/request-otp again
      const res = await apiClient.post<{ expiresIn: number }>(
        ENDPOINTS.AUTH.REQUEST_OTP,
        { phoneNumber: phone }
      );

      const newExpiresIn = res?.expiresIn || 180;
      setCountdown(newExpiresIn);
      setResendCount((prev) => prev + 1);
      setOtpCode('');
    } catch (err: any) {
      if (err?.status === 429 || err?.code === 'RATE_LIMIT_EXCEEDED') {
        setErrorMessage('অনেকবার চেষ্টা করেছেন, এক ঘণ্টা পর আবার চেষ্টা করুন');
      } else {
        setErrorMessage(err?.message || 'কোড পুনরায় পাঠাতে ব্যর্থ হয়েছে');
      }
    } finally {
      setIsResending(false);
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
          {/* Back button: "নম্বর পরিবর্তন" */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.primary} />
              <AppText
                variant="bodySmall"
                weight="600"
                color={colors.primary}
                style={styles.backButtonText}
              >
                নম্বর পরিবর্তন
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Heading & Subtitle */}
          <View style={styles.header}>
            <AppText variant="heading1" style={styles.heading}>
              কোডটি লিখুন
            </AppText>

            <AppText
              variant="body"
              color={colors.textSecondary}
              style={styles.subtitle}
            >
              {formattedPhone} নম্বরে পাঠানো ৬ ডিজিটের কোড দিন
            </AppText>
          </View>

          {/* 6 Separate OTP Boxes */}
          <View style={styles.otpWrapper}>
            <OtpInput
              value={otpCode}
              onChange={handleOtpChange}
              length={6}
              error={hasError}
              isSuccess={isSuccess}
              disabled={isLoading || isSuccess}
              autoFocus={true}
            />

            {/* Error Message */}
            {hasError && errorMessage && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <AppText variant="caption" color={colors.error} style={styles.errorText}>
                  {errorMessage}
                </AppText>
              </View>
            )}
          </View>

          {/* Countdown & Resend Section */}
          <View style={styles.resendSection}>
            {countdown > 0 ? (
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  কোড মেয়াদ শেষ হতে বাকি: {formatTimer(countdown)}
                </AppText>
              </View>
            ) : resendCount < 3 ? (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={isResending}
                activeOpacity={0.7}
                style={styles.resendButton}
              >
                <Ionicons
                  name={isResending ? 'hourglass-outline' : 'refresh-outline'}
                  size={18}
                  color={colors.primary}
                />
                <AppText variant="bodySmall" weight="600" color={colors.primary}>
                  {isResending ? 'কোড পাঠানো হচ্ছে...' : 'কোড পাননি? আবার পাঠান'}
                </AppText>
              </TouchableOpacity>
            ) : (
              <AppText variant="caption" color={colors.textMuted} align="center">
                সর্বোচ্চ ৩ বার কোড পাঠানো হয়েছে।
              </AppText>
            )}

            {resendCount > 0 && resendCount < 3 && countdown > 0 && (
              <AppText variant="caption" color={colors.textMuted} style={styles.resendRemaining}>
                (পুনরায় পাঠানোর বাকি: {toBanglaDigits(3 - resendCount)} বার)
              </AppText>
            )}
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* "যাচাই করুন" Action Button */}
          <View style={styles.footer}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              title="যাচাই করুন"
              disabled={otpCode.length !== 6 || isLoading || isSuccess}
              loading={isLoading}
              onPress={() => handleVerify(otpCode)}
              style={styles.submitButton}
            />
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
  },
  navRow: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    gap: 6,
  },
  backButtonText: {
    fontFamily: FontFamilies.semiBold,
  },
  header: {
    marginBottom: Spacing.xxl,
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
  otpWrapper: {
    marginBottom: Spacing.lg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
  },
  resendSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resendRemaining: {
    marginTop: 4,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing['3xl'],
  },
  footer: {
    paddingTop: Spacing.md,
  },
  submitButton: {
    borderRadius: Radius.lg,
  },
});
