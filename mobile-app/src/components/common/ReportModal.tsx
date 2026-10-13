import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { reportService } from '@/services/report.service';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { toBanglaDigits } from '@/lib/format';
import { AppText, BottomSheet, Button, StepProgress, SuccessCheck } from '@/components/ui';
import type { ReportReason, ReportTargetType } from '@/types/listing.types';

export const REPORT_REASONS: { value: ReportReason; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'scam', label: 'প্রতারণা / স্ক্যাম', icon: 'warning-outline' },
  { value: 'harassment', label: 'হয়রানি বা খারাপ আচরণ', icon: 'sad-outline' },
  { value: 'misrepresentation', label: 'ভুল দাম বা ভুল বর্ণনা', icon: 'pricetag-outline' },
  { value: 'inappropriate', label: 'অনুপযুক্ত কন্টেন্ট', icon: 'eye-off-outline' },
  { value: 'other', label: 'অন্যান্য', icon: 'ellipsis-horizontal-circle-outline' },
];

export const getReasonLabel = (value: ReportReason) => REPORT_REASONS.find((r) => r.value === value)?.label ?? value;

const MAX = 1000;

export interface ReportModalProps {
  /** Capitalised exactly like the backend expects */
  targetType: ReportTargetType;
  targetId: string;
  /** Shown in the header, e.g. the ad title or the user's name */
  targetName?: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * Report a listing or a user (Prompt 39) + confirmation (Prompt 40).
 * Steps: reason → description (required) → confirm → success.
 * Entry points must check verification first (useRequireVerified).
 */
export function ReportModal({ targetType, targetId, targetName, visible, onClose }: ReportModalProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setReason(null);
      setDescription('');
      setError(null);
      setReportId(null);
    }
  }, [visible]);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      const report = await reportService.createReport({ targetType, targetId, reason, description });
      setReportId(report.id);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'DUPLICATE_REPORT') {
        setError('আপনি এটি আগেই রিপোর্ট করেছেন, আমাদের টিম দেখছে।');
      } else {
        // e.g. "You cannot report yourself" / your own listing
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const title = targetType === 'Listing' ? 'বিজ্ঞাপন রিপোর্ট করুন' : 'ব্যবহারকারী রিপোর্ট করুন';

  const footer =
    step === 0 ? (
      <Button title="পরবর্তী" onPress={() => setStep(1)} disabled={!reason} fullWidth size="lg" />
    ) : step === 1 ? (
      <View style={styles.footerRow}>
        <Button title="পেছনে" variant="outline" onPress={() => setStep(0)} style={styles.flex} />
        <Button
          title="পরবর্তী"
          onPress={() => setStep(2)}
          disabled={!description.trim()}
          style={styles.flex2}
        />
      </View>
    ) : step === 2 ? (
      <View style={styles.footerRow}>
        <Button title="পেছনে" variant="outline" onPress={() => setStep(1)} style={styles.flex} disabled={submitting} />
        <Button title="রিপোর্ট জমা দিন" variant="danger" onPress={submit} loading={submitting} style={styles.flex2} />
      </View>
    ) : (
      <Button title="ঠিক আছে" onPress={onClose} fullWidth size="lg" />
    );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={step < 3 ? title : undefined}
      snapPoints={[0.75, 0.92]}
      footer={footer}
    >
      {step < 3 ? <StepProgress step={step + 1} total={3} title={['কারণ', 'বিস্তারিত', 'নিশ্চিত করুন'][step]} /> : null}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {targetName && step < 3 ? (
          <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={1} style={styles.target}>
            {targetType === 'Listing' ? '📦' : '👤'} {targetName}
          </AppText>
        ) : null}

        {step === 0
          ? REPORT_REASONS.map((r) => {
              const active = reason === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setReason(r.value)}
                  style={[
                    styles.reason,
                    { borderColor: active ? colors.error : colors.border, backgroundColor: active ? colors.errorSoft : colors.surface },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={r.icon} size={20} color={active ? colors.error : colors.textSecondary} />
                  <AppText variant="body" style={styles.flex}>
                    {r.label}
                  </AppText>
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={active ? colors.error : colors.textMuted}
                  />
                </Pressable>
              );
            })
          : null}

        {step === 1 ? (
          <>
            <AppText variant="bodySmall" style={styles.bold}>
              কী ঘটেছে? <AppText color={colors.accent}>*</AppText>
            </AppText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={MAX}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder="কী ঘটেছে সংক্ষেপে লিখুন…"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <AppText variant="caption" color={colors.textMuted} align="right">
              {toBanglaDigits(description.length)}/{toBanglaDigits(MAX)}
            </AppText>
          </>
        ) : null}

        {step === 2 ? (
          <View style={styles.confirm}>
            <View style={[styles.warningBox, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
              <Ionicons name="alert-circle" size={22} color={colors.warning} />
              <AppText variant="body" style={styles.flex}>
                মিথ্যা রিপোর্ট করলে আপনার অ্যাকাউন্টের বিরুদ্ধে ব্যবস্থা নেওয়া হতে পারে। জমা দেবেন?
              </AppText>
            </View>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              কারণ: <AppText variant="bodySmall" style={styles.bold}>{reason ? getReasonLabel(reason) : ''}</AppText>
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={4}>
              বিবরণ: {description.trim()}
            </AppText>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.success}>
            <SuccessCheck size={72} />
            <AppText variant="heading2" align="center">
              ✅ রিপোর্ট জমা হয়েছে
            </AppText>
            {reportId ? (
              <AppText variant="bodySmall" color={colors.textSecondary} align="center">
                রিপোর্ট নং: #{reportId.slice(-6).toUpperCase()}
              </AppText>
            ) : null}
            <AppText variant="body" color={colors.textSecondary} align="center">
              আমাদের টিম ২৪ ঘণ্টার মধ্যে দেখবে।
            </AppText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorSoft }]}>
            <AppText variant="bodySmall" color={colors.error}>
              {error}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex2: { flex: 2 },
  bold: { fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  target: { marginBottom: 4 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.md, borderWidth: 1.5 },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontFamily: FontFamilies.regular,
    fontSize: 15,
  },
  confirm: { gap: 12 },
  warningBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: Radius.md, borderWidth: 1 },
  success: { alignItems: 'center', gap: 8, paddingTop: 16 },
  errorBox: { padding: 12, borderRadius: Radius.md },
  footerRow: { flexDirection: 'row', gap: 10 },
});

export default ReportModal;
