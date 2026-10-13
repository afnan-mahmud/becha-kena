import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { CATEGORIES, CONDITIONS } from '@/constants/categories';
import { DIVISION_COORDINATES, formatLocation, LocationSelection } from '@/constants/locations';
import { formatPrice } from '@/lib/format';
import { getErrorCode, getErrorDetails, getErrorMessage } from '@/lib/errors';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth.store';
import { AppText, Button, Chip, Input, StepProgress } from '@/components/ui';
import { LocationPicker } from '@/components/common/LocationPicker';
import { ImagePickerGrid, UploadItem, getUploadedUrls, isAnyUploading, toUploadItems } from './ImagePickerGrid';
import { ListingCard } from './ListingCard';
import type { CreateListingBody, Listing, ListingCondition } from '@/types/listing.types';

export interface ListingFormValues {
  category: string;
  condition: ListingCondition | '';
  title: string;
  description: string;
  price: string;
  division: string;
  district: string;
  thana: string;
  addressLine: string;
  hidePhoneNumber: boolean;
}

export interface ListingFormProps {
  /** Existing ad for the edit screen */
  initial?: Listing;
  submitLabel?: string;
  /** Throw to show an error; VALIDATION_FAILED jumps to the step with the bad field */
  onSubmit: (body: CreateListingBody) => Promise<void>;
}

const STEPS = ['ক্যাটাগরি ও অবস্থা', 'বিবরণ ও দাম', 'ছবি', 'লোকেশন ও প্রকাশ'] as const;

const STEP_FIELDS: (keyof ListingFormValues)[][] = [
  ['category', 'condition'],
  ['title', 'description', 'price'],
  [],
  ['division', 'district', 'thana'],
];

/** Map backend validation details ("title must be…") to the step that owns the field */
const stepForDetails = (details: string) => {
  const d = details.toLowerCase();
  if (/category|condition/.test(d)) return 0;
  if (/title|description|price/.test(d)) return 1;
  if (/image/.test(d)) return 2;
  if (/location|coordinates|division|district|thana|address/.test(d)) return 3;
  return null;
};

const toNumber = (text: string) => text.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/[^\d]/g, '');

const defaultsFrom = (l?: Listing): ListingFormValues => ({
  category: l?.category ?? '',
  condition: l?.condition ?? '',
  title: l?.title ?? '',
  description: l?.description ?? '',
  price: l ? String(l.price) : '',
  division: l?.location?.division ?? '',
  district: l?.location?.district ?? '',
  thana: l?.location?.thana ?? '',
  addressLine: l?.location?.addressLine ?? '',
  hidePhoneNumber: l?.hidePhoneNumber ?? false,
});

/**
 * 4-step ad form shared by "বিজ্ঞাপন দিন" and the edit screen (Prompt 19).
 * Values are kept when going back. Images upload as soon as they are picked.
 */
export function ListingForm({ initial, submitLabel = 'বিজ্ঞাপন প্রকাশ করুন', onSubmit }: ListingFormProps) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadItem[]>(() => toUploadItems(initial?.images ?? []));
  const [imageError, setImageError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const location = useLocation();

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ListingFormValues>({ defaultValues: defaultsFrom(initial), mode: 'onTouched' });

  const values = watch();
  const uploading = isAnyUploading(images);
  const uploadedUrls = getUploadedUrls(images);

  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  const next = async () => {
    setServerError(null);
    if (step === 2) {
      if (uploading) return;
      if (uploadedUrls.length < 1) {
        setImageError('অন্তত ১টি ছবি যোগ করুন');
        return;
      }
      setImageError(null);
    } else {
      const ok = await trigger(STEP_FIELDS[step]);
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    scrollTop();
  };

  const applyLocation = (sel: LocationSelection | null) => {
    setValue('division', sel?.division ?? '', { shouldValidate: true });
    setValue('district', sel?.district ?? '', { shouldValidate: true });
    setValue('thana', sel?.thana ?? '', { shouldValidate: true });
  };

  const fillFromGps = async () => {
    const result = await location.request();
    if (!result) return;
    if (!result.division) {
      Alert.alert('এলাকা পাওয়া যায়নি', 'তালিকা থেকে আপনার বিভাগ, জেলা ও থানা বেছে নিন।');
      setPickerOpen(true);
      return;
    }
    // GPS gives us the division only — then pick the district and thana
    applyLocation({ division: result.division });
    setPickerOpen(true);
  };

  const submit = handleSubmit(async (v) => {
    setServerError(null);
    if (uploadedUrls.length < 1) {
      setStep(2);
      setImageError('অন্তত ১টি ছবি যোগ করুন');
      return;
    }
    const body: CreateListingBody = {
      title: v.title.trim(),
      description: v.description.trim(),
      price: Number(v.price),
      category: v.category,
      condition: v.condition as ListingCondition,
      images: uploadedUrls,
      hidePhoneNumber: v.hidePhoneNumber,
      location: {
        coordinates: DIVISION_COORDINATES[v.division], // [lng, lat] of the division centre
        division: v.division,
        district: v.district,
        thana: v.thana,
        addressLine: v.addressLine.trim() || undefined,
      },
    };
    setSubmitting(true);
    try {
      await onSubmit(body);
      if (!initial) {
        reset(defaultsFrom());
        setImages([]);
        setStep(0);
      }
    } catch (err) {
      if (getErrorCode(err) === 'VALIDATION_FAILED') {
        const details = getErrorDetails(err) ?? '';
        const target = stepForDetails(details);
        if (target !== null) setStep(target);
        setServerError(details || getErrorMessage(err));
      } else {
        setServerError(getErrorMessage(err));
      }
      scrollTop();
    } finally {
      setSubmitting(false);
    }
  });

  // Live preview (step 4) — what buyers will see in the feed
  const preview: Listing = useMemo(
    () => ({
      id: 'preview',
      sellerId: user
        ? {
            id: user.id,
            displayName: user.displayName,
            verifiedName: user.verifiedName,
            isVerified: user.isVerified,
            averageRating: user.averageRating,
            totalReviews: user.totalReviews,
            createdAt: user.createdAt,
          }
        : '',
      title: values.title || 'আপনার বিজ্ঞাপনের শিরোনাম',
      description: values.description,
      price: Number(values.price) || 0,
      category: values.category,
      condition: (values.condition || 'used') as ListingCondition,
      images: uploadedUrls,
      hidePhoneNumber: values.hidePhoneNumber,
      location: { type: 'Point', coordinates: [0, 0], division: values.division, district: values.district, thana: values.thana },
      status: 'pending',
      soldToBuyerId: null,
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [values.title, values.description, values.price, values.category, values.condition, values.hidePhoneNumber, values.division, values.district, values.thana, uploadedUrls, user]
  );

  const sectionLabel = (text: string, required = true) => (
    <AppText variant="bodySmall" style={styles.label}>
      {text}
      {required ? <AppText color={colors.accent}> *</AppText> : null}
    </AppText>
  );

  return (
    <View style={styles.flex}>
      <StepProgress step={step + 1} total={STEPS.length} title={STEPS[step]} />

      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {serverError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.errorSoft, borderColor: colors.error }]}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <AppText variant="bodySmall" color={colors.error} style={styles.flex}>
              {serverError}
            </AppText>
          </View>
        ) : null}

        <Animated.View key={step} entering={FadeInRight.duration(220)} exiting={FadeOutLeft.duration(150)}>
          {/* ── Step 1: category + condition ─────────────────────────────── */}
          {step === 0 ? (
            <>
              {sectionLabel('ক্যাটাগরি')}
              <Controller
                control={control}
                name="category"
                rules={{ required: 'একটি ক্যাটাগরি বেছে নিন' }}
                render={({ field: { value, onChange } }) => (
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((c) => {
                      const selected = value === c.value;
                      return (
                        <Pressable
                          key={c.value}
                          onPress={() => onChange(c.value)}
                          style={[
                            styles.categoryTile,
                            {
                              backgroundColor: selected ? colors.primarySoft : colors.surface,
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                        >
                          <View style={[styles.emojiCircle, { backgroundColor: c.tint }]}>
                            <AppText style={styles.emoji}>{c.emoji}</AppText>
                          </View>
                          <AppText
                            variant="caption"
                            align="center"
                            numberOfLines={2}
                            color={selected ? colors.primary : colors.text}
                            style={selected ? styles.bold : undefined}
                          >
                            {c.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
              {errors.category ? <AppText variant="caption" color={colors.error}>{errors.category.message}</AppText> : null}

              {sectionLabel('পণ্যের অবস্থা')}
              <Controller
                control={control}
                name="condition"
                rules={{ required: 'পণ্যের অবস্থা বেছে নিন' }}
                render={({ field: { value, onChange } }) => (
                  <View style={styles.row}>
                    {CONDITIONS.map((c) => (
                      <Chip key={c.value} label={c.label} selected={value === c.value} onPress={() => onChange(c.value)} />
                    ))}
                  </View>
                )}
              />
              {errors.condition ? <AppText variant="caption" color={colors.error}>{errors.condition.message}</AppText> : null}
            </>
          ) : null}

          {/* ── Step 2: title, description, price ───────────────────────── */}
          {step === 1 ? (
            <>
              <Controller
                control={control}
                name="title"
                rules={{
                  validate: (v) => {
                    const t = v.trim();
                    if (t.length < 10) return 'শিরোনাম অন্তত ১০ অক্ষরের হতে হবে';
                    if (t.length > 80) return 'শিরোনাম সর্বোচ্চ ৮০ অক্ষরের হতে পারবে';
                    return true;
                  },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="শিরোনাম *"
                    placeholder="যেমন: iPhone 13 Pro 128GB — fresh condition"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    maxLength={80}
                    characterCounter
                    error={errors.title?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="description"
                rules={{
                  validate: (v) => {
                    const t = v.trim();
                    if (t.length < 20) return 'বিবরণ অন্তত ২০ অক্ষরের হতে হবে';
                    if (t.length > 1000) return 'বিবরণ সর্বোচ্চ ১০০০ অক্ষরের হতে পারবে';
                    return true;
                  },
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="বিবরণ *"
                    placeholder="পণ্যের অবস্থা, কতদিন ব্যবহার করেছেন, কোনো সমস্যা আছে কিনা, সাথে কী কী দিচ্ছেন…"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    maxLength={1000}
                    characterCounter
                    multiline
                    textAlignVertical="top"
                    inputStyle={styles.multiline}
                    error={errors.description?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="price"
                rules={{
                  validate: (v) => (v !== '' && Number(v) >= 0 ? true : 'সঠিক দাম লিখুন'),
                }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="দাম (টাকা) *"
                    placeholder="যেমন: 68000"
                    value={value}
                    onChangeText={(t) => onChange(toNumber(t))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={9}
                    leftIcon={<AppText variant="body" color={colors.textSecondary}>৳</AppText>}
                    hint={value ? formatPrice(Number(value)) : 'দাম আলোচনা সাপেক্ষে হলে বিবরণে লিখুন'}
                    error={errors.price?.message}
                  />
                )}
              />
            </>
          ) : null}

          {/* ── Step 3: photos ──────────────────────────────────────────── */}
          {step === 2 ? (
            <>
              {sectionLabel('ছবি (১-১০টি)')}
              <AppText variant="caption" color={colors.textSecondary} style={styles.helper}>
                প্রথম ছবিটি কভার হবে। অন্য ছবিকে কভার বানাতে চেপে ধরুন। পরিষ্কার আলোতে আসল পণ্যের ছবি দিন।
              </AppText>
              <ImagePickerGrid value={images} onChange={setImages} max={10} />
              {imageError ? (
                <AppText variant="caption" color={colors.error} style={styles.helper}>
                  {imageError}
                </AppText>
              ) : null}
              {uploading ? (
                <AppText variant="caption" color={colors.info} style={styles.helper}>
                  ছবি আপলোড হচ্ছে…
                </AppText>
              ) : null}
            </>
          ) : null}

          {/* ── Step 4: location + publish ──────────────────────────────── */}
          {step === 3 ? (
            <>
              {sectionLabel('এলাকা')}
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={[
                  styles.locationBox,
                  {
                    borderColor: errors.division || errors.district || errors.thana ? colors.error : colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <AppText variant="body" style={styles.flex} color={values.division ? colors.text : colors.textMuted}>
                  {values.thana
                    ? [values.thana, values.district, values.division].join(', ')
                    : formatLocation(values) || 'বিভাগ › জেলা › থানা বেছে নিন'}
                </AppText>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
              {/* hidden validators for the three location fields */}
              {(['division', 'district', 'thana'] as const).map((name) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  rules={{ required: 'বিভাগ, জেলা ও থানা সবগুলো বেছে নিন' }}
                  render={() => <></>}
                />
              ))}
              {errors.division || errors.district || errors.thana ? (
                <AppText variant="caption" color={colors.error}>
                  বিভাগ, জেলা ও থানা সবগুলো বেছে নিন
                </AppText>
              ) : null}

              <Button
                title={location.loading ? 'লোকেশন খোঁজা হচ্ছে…' : 'বর্তমান লোকেশন ব্যবহার করুন'}
                variant="ghost"
                size="sm"
                loading={location.loading}
                leftIcon={<Ionicons name="navigate" size={16} color={colors.primary} />}
                onPress={fillFromGps}
                style={styles.gpsButton}
              />
              {location.error ? (
                <AppText variant="caption" color={colors.warning}>
                  {location.error}
                </AppText>
              ) : null}

              <Controller
                control={control}
                name="addressLine"
                rules={{ maxLength: { value: 120, message: 'সর্বোচ্চ ১২০ অক্ষর' } }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="রাস্তা / এলাকার নাম (ঐচ্ছিক)"
                    placeholder="যেমন: রোড ৭, ধানমন্ডি"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    maxLength={120}
                    hint="⚠️ পুরো বাসার ঠিকানা দেবেন না"
                    error={errors.addressLine?.message}
                    containerStyle={styles.addressInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="hidePhoneNumber"
                render={({ field: { value, onChange } }) => (
                  <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.flex}>
                      <AppText variant="body" style={styles.bold}>
                        ফোন নম্বর লুকিয়ে রাখুন
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        চালু করলে ক্রেতারা শুধু চ্যাটে যোগাযোগ করতে পারবেন
                      </AppText>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ true: colors.primary, false: colors.borderDark }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                )}
              />

              {sectionLabel('প্রিভিউ', false)}
              <View style={styles.preview} pointerEvents="none">
                <ListingCard listing={preview} variant="list" onPress={() => {}} />
              </View>

              <LocationPicker
                visible={pickerOpen}
                onClose={() => setPickerOpen(false)}
                value={values.division ? { division: values.division, district: values.district || undefined, thana: values.thana || undefined } : null}
                onSelect={applyLocation}
                allowAll={false}
                requireThana
              />
            </>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        {step > 0 ? (
          <Button title="পেছনে" variant="outline" onPress={back} style={styles.backBtn} disabled={submitting} />
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button
            title={step === 2 && uploading ? 'আপলোড হচ্ছে…' : 'পরের ধাপ'}
            onPress={next}
            disabled={step === 2 && (uploading || uploadedUrls.length === 0)}
            style={styles.nextBtn}
          />
        ) : (
          <Button title={submitLabel} variant="accent" onPress={submit} loading={submitting} style={styles.nextBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: FontFamilies.semiBold, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 8 },
  helper: { marginBottom: 10, marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  categoryTile: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: 6,
  },
  emojiCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22, lineHeight: 28 },
  multiline: { minHeight: 140, paddingTop: 12 },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    minHeight: 52,
    paddingVertical: 10,
  },
  gpsButton: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 0 },
  addressInput: { marginTop: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 12,
  },
  preview: { marginHorizontal: -12 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});

export default ListingForm;
