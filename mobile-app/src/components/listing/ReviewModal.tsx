import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { reviewService } from '@/services/review.service';
import { hasReviewed, markReviewed } from '@/lib/reviewed';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { formatPrice, toBanglaDigits } from '@/lib/format';
import { toast } from '@/lib/toast';
import { AppText, BottomSheet, Button, StarRating, SuccessCheck } from '@/components/ui';

export interface ReviewTarget {
  listingId: string;
  title: string;
  image?: string;
  price?: number;
  sellerId: string;
  sellerName: string;
}

const MAX = 500;
const RATING_LABELS = ['', 'খুব খারাপ', 'খারাপ', 'মোটামুটি', 'ভালো', 'অসাধারণ'];

/** true once this account has reviewed the ad (stored locally) */
export function useHasReviewed(listingId?: string) {
  const [reviewed, setReviewed] = useState<boolean | null>(null);
  useEffect(() => {
    if (!listingId) return;
    let alive = true;
    hasReviewed(listingId).then((v) => alive && setReviewed(v));
    return () => {
      alive = false;
    };
  }, [listingId]);
  return [reviewed, () => setReviewed(true)] as const;
}

/**
 * Buyer → seller review (Prompt 34). Shown only to the buyer the ad was sold to.
 * POST /reviews { listingId, rating, reviewText }.
 */
export function ReviewModal({
  target,
  visible,
  onClose,
  onReviewed,
}: {
  target: ReviewTarget | null;
  visible: boolean;
  onClose: () => void;
  /** Called after success OR when the server says it was already reviewed */
  onReviewed?: () => void;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Fresh form every time the sheet opens
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setRating(0);
      setText('');
      setError(null);
      setDone(false);
    }
  }

  const finishReviewed = async () => {
    if (!target) return;
    await markReviewed(target.listingId);
    onReviewed?.();
  };

  const submit = async () => {
    if (!target) return;
    if (rating < 1) return setError('রেটিং দিন (১-৫ স্টার)');
    if (!text.trim()) return setError('কয়েক লাইনে আপনার অভিজ্ঞতা লিখুন');
    setSubmitting(true);
    setError(null);
    try {
      await reviewService.createReview({ listingId: target.listingId, rating, reviewText: text });
      await finishReviewed();
      queryClient.invalidateQueries({ queryKey: ['reviews', target.sellerId] });
      queryClient.invalidateQueries({ queryKey: ['user', target.sellerId] });
      setDone(true);
      toast.success('ধন্যবাদ! আপনার রিভিউ জমা হয়েছে ✅');
    } catch (err) {
      if (getErrorCode(err) === 'DUPLICATE_ENTRY') {
        await finishReviewed();
        setError('এই বিজ্ঞাপনের জন্য আপনি আগেই রিভিউ দিয়েছেন');
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={done ? undefined : 'বিক্রেতাকে রিভিউ দিন'}
      snapPoints={[0.75, 0.92]}
      initialSnap={0}
      footer={
        done ? (
          <Button title="ঠিক আছে" onPress={onClose} fullWidth size="lg" />
        ) : (
          <Button title="রিভিউ জমা দিন" onPress={submit} loading={submitting} fullWidth size="lg" />
        )
      }
    >
      {done ? (
        <View style={styles.done}>
          <SuccessCheck size={80} />
          <AppText variant="heading2" align="center">
            ধন্যবাদ!
          </AppText>
          <AppText variant="body" align="center" color={colors.textSecondary}>
            আপনার রিভিউ অন্য ক্রেতাদের সাহায্য করবে।
          </AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {target ? (
            <View style={[styles.listing, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Image source={{ uri: target.image }} style={styles.thumb} contentFit="cover" cachePolicy="memory-disk" />
              <View style={styles.flex}>
                <AppText variant="bodySmall" numberOfLines={2} style={styles.bold}>
                  {target.title}
                </AppText>
                {target.price !== undefined ? (
                  <AppText variant="caption" color={colors.primary} style={styles.bold}>
                    {formatPrice(target.price)}
                  </AppText>
                ) : null}
                <AppText variant="caption" color={colors.textSecondary}>
                  বিক্রেতা: {target.sellerName}
                </AppText>
              </View>
            </View>
          ) : null}

          <View style={styles.stars}>
            <StarRating value={rating} onChange={setRating} size={40} />
            <AppText variant="bodySmall" color={rating ? colors.warning : colors.textMuted} style={styles.ratingLabel}>
              {rating ? RATING_LABELS[rating] : 'স্টারে ট্যাপ করুন'}
            </AppText>
          </View>

          <AppText variant="bodySmall" style={styles.bold}>
            আপনার অভিজ্ঞতা <AppText color={colors.accent}>*</AppText>
          </AppText>
          <TextInput
            value={text}
            onChangeText={setText}
            maxLength={MAX}
            multiline
            textAlignVertical="top"
            placeholder="পণ্যটি বর্ণনা অনুযায়ী ছিল? বিক্রেতার ব্যবহার কেমন ছিল?"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <AppText variant="caption" color={text.length > 450 ? colors.warning : colors.textMuted} align="right">
            {toBanglaDigits(text.length)}/{toBanglaDigits(MAX)}
          </AppText>

          {error ? (
            <AppText variant="bodySmall" color={colors.error} style={styles.error}>
              {error}
            </AppText>
          ) : null}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  listing: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: Radius.md, borderWidth: 1 },
  thumb: { width: 60, height: 60, borderRadius: Radius.sm },
  stars: { alignItems: 'center', paddingVertical: 20 },
  ratingLabel: { marginTop: 8, fontWeight: '600' },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: FontFamilies.regular,
    fontSize: 15,
  },
  error: { marginTop: 8 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
});

export default ReviewModal;
