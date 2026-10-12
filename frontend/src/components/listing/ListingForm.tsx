import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, MapPin, EyeOff } from 'lucide-react';
import { StepIndicator } from '../common/StepIndicator';
import { ImageUploader, fromUploadedUrls, type ImageFile } from '../common/ImageUploader';
import { CATEGORIES, CONDITIONS, LISTING_LIMITS, getCategory, getConditionLabel } from '../../utils/constants';
import { DIVISIONS, DISTRICTS, THANAS, getDivisionCoordinates } from '../../utils/locations';
import { formatNumber, formatPrice } from '../../utils/formatters';
import type { IListing, ListingConditionValue } from '../../types';
import type { ListingPayload } from '../../services/listing.service';
import './ListingForm.css';

interface FormValues {
  category: string;
  condition: ListingConditionValue | '';
  title: string;
  description: string;
  price: string;
  division: string;
  district: string;
  thana: string;
  addressLine: string;
  hidePhoneNumber: boolean;
}

interface ListingFormProps {
  initial?: IListing;
  submitLabel: string;
  onSubmit: (payload: ListingPayload) => Promise<void>;
}

const STEPS = ['ক্যাটাগরি', 'বিবরণ ও দাম', 'ছবি', 'লোকেশন ও প্রকাশ'];

export const ListingForm = ({ initial, submitLabel, onSubmit }: ListingFormProps) => {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<ImageFile[]>(() => fromUploadedUrls(initial?.images || []));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      category: initial?.category || '',
      condition: initial?.condition || '',
      title: initial?.title || '',
      description: initial?.description || '',
      price: initial ? String(initial.price) : '',
      division: initial?.location?.division || '',
      district: initial?.location?.district || '',
      thana: initial?.location?.thana || '',
      addressLine: initial?.location?.addressLine || '',
      hidePhoneNumber: initial?.hidePhoneNumber ?? false,
    },
  });

  const values = watch();
  const uploadedImages = images.filter((img) => img.uploadedUrl).map((img) => img.uploadedUrl as string);

  // Mirrors the backend rule: title change or >20% price change sends the ad back to moderation
  const needsReReview = useMemo(() => {
    if (!initial || initial.status !== 'active') return false;
    const price = Number(values.price);
    const priceChange = initial.price > 0 ? Math.abs(price - initial.price) / initial.price : 0;
    return values.title.trim() !== initial.title || priceChange > 0.2;
  }, [initial, values.title, values.price]);

  const goNext = async () => {
    const fieldsByStep: (keyof FormValues)[][] = [['category', 'condition'], ['title', 'description', 'price'], [], []];
    if (step === 2) {
      if (images.some((img) => img.progress > 0 && img.progress < 100)) {
        toast.error('ছবি আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন');
        return;
      }
      if (uploadedImages.length === 0) {
        toast.error('অন্তত ১টি ছবি দিন');
        return;
      }
    }
    const ok = await trigger(fieldsByStep[step]);
    if (ok) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (data: FormValues) => {
    if (uploadedImages.length === 0) {
      setStep(2);
      toast.error('অন্তত ১টি ছবি দিন');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: data.title.trim(),
        description: data.description.trim(),
        price: Number(data.price),
        category: data.category,
        condition: data.condition,
        images: uploadedImages,
        hidePhoneNumber: data.hidePhoneNumber,
        location: {
          type: 'Point',
          coordinates: getDivisionCoordinates(data.division),
          division: data.division,
          district: data.district,
          thana: data.thana,
          addressLine: data.addressLine.trim() || undefined,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const category = getCategory(values.category);

  return (
    <div className="listing-form">
      <StepIndicator steps={STEPS} currentStep={step} />

      <form onSubmit={handleSubmit(submit)} className="listing-form__card" noValidate>
        {step === 0 && (
          <div className="slide-in">
            <h2 className="listing-form__h">কী বিক্রি করতে চান?</h2>
            <input type="hidden" {...register('category', { required: 'একটি ক্যাটাগরি বেছে নিন' })} />
            <div className="pick-grid">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  className={`pick-card ${values.category === cat.value ? 'selected' : ''}`}
                  onClick={() => setValue('category', cat.value, { shouldValidate: true })}
                  style={{ ['--tile' as string]: cat.tint }}
                >
                  <span className="pick-card__emoji" aria-hidden="true">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="error-text">{errors.category.message}</p>}

            <h2 className="listing-form__h mt-5">পণ্যের অবস্থা</h2>
            <input type="hidden" {...register('condition', { required: 'পণ্যের অবস্থা বেছে নিন' })} />
            <div className="condition-row">
              {CONDITIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  className={`chip ${values.condition === c.value ? 'active' : ''}`}
                  onClick={() => setValue('condition', c.value, { shouldValidate: true })}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {errors.condition && <p className="error-text">{errors.condition.message}</p>}
          </div>
        )}

        {step === 1 && (
          <div className="slide-in">
            <h2 className="listing-form__h">বিজ্ঞাপনের বিবরণ</h2>
            <div className="form-group">
              <label htmlFor="title">শিরোনাম <span className="required">*</span></label>
              <input
                id="title"
                className="input"
                placeholder="যেমন: iPhone 13 Pro 128GB — ফ্রেশ কন্ডিশন"
                maxLength={LISTING_LIMITS.titleMax}
                {...register('title', {
                  required: 'শিরোনাম লিখুন',
                  validate: (v) => v.trim().length >= LISTING_LIMITS.titleMin || `কমপক্ষে ${formatNumber(LISTING_LIMITS.titleMin)} অক্ষর লিখুন`,
                })}
              />
              <div className="char-counter">
                <span className="error-text">{errors.title?.message}</span>
                <span>{formatNumber(values.title.length)}/{formatNumber(LISTING_LIMITS.titleMax)}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">বিস্তারিত বিবরণ <span className="required">*</span></label>
              <textarea
                id="description"
                className="input"
                rows={7}
                maxLength={LISTING_LIMITS.descriptionMax}
                placeholder="কবে কিনেছেন, ওয়ারেন্টি আছে কি না, কোনো সমস্যা আছে কি না, বক্স/চার্জার আছে কি না — বিস্তারিত লিখুন।"
                {...register('description', {
                  required: 'বিবরণ লিখুন',
                  validate: (v) => v.trim().length >= LISTING_LIMITS.descriptionMin || `কমপক্ষে ${formatNumber(LISTING_LIMITS.descriptionMin)} অক্ষর লিখুন`,
                })}
              />
              <div className="char-counter">
                <span className="error-text">{errors.description?.message}</span>
                <span>{formatNumber(values.description.length)}/{formatNumber(LISTING_LIMITS.descriptionMax)}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="price">দাম <span className="required">*</span></label>
              <div className="price-field">
                <span>৳</span>
                <input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="input"
                  placeholder="0"
                  {...register('price', {
                    required: 'দাম লিখুন',
                    validate: (v) => (Number.isFinite(Number(v)) && Number(v) >= 0) || 'সঠিক দাম লিখুন',
                  })}
                />
              </div>
              {errors.price && <span className="error-text">{errors.price.message}</span>}
              {values.price && Number(values.price) > 0 && <span className="help-text">দেখাবে: {formatPrice(Number(values.price))}</span>}
            </div>

            {needsReReview && (
              <div className="form-alert">
                <AlertTriangle size={18} />
                শিরোনাম বা দামে বড় পরিবর্তন করলে বিজ্ঞাপনটি আবার মডারেশনে যাবে।
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="slide-in">
            <h2 className="listing-form__h">ছবি দিন</h2>
            <p className="help-text mb-4">
              আসল ও পরিষ্কার ছবি দিন — ভালো ছবিতে দ্রুত বিক্রি হয়। প্রথম ছবিটি কভার হিসেবে দেখাবে। সর্বোচ্চ {formatNumber(LISTING_LIMITS.maxImages)}টি।
            </p>
            <ImageUploader maxFiles={LISTING_LIMITS.maxImages} images={images} onImagesChange={setImages} />
          </div>
        )}

        {step === 3 && (
          <div className="slide-in">
            <h2 className="listing-form__h">কোথা থেকে বিক্রি করছেন?</h2>
            <div className="location-grid">
              <div className="form-group">
                <label htmlFor="division">বিভাগ <span className="required">*</span></label>
                <select
                  id="division"
                  className="input"
                  {...register('division', {
                    required: 'বিভাগ বেছে নিন',
                    onChange: () => { setValue('district', ''); setValue('thana', ''); },
                  })}
                >
                  <option value="">নির্বাচন করুন</option>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.division && <span className="error-text">{errors.division.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="district">জেলা <span className="required">*</span></label>
                <select
                  id="district"
                  className="input"
                  disabled={!values.division}
                  {...register('district', { required: 'জেলা বেছে নিন', onChange: () => setValue('thana', '') })}
                >
                  <option value="">নির্বাচন করুন</option>
                  {DISTRICTS[values.division]?.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <span className="error-text">{errors.district.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="thana">থানা / এলাকা <span className="required">*</span></label>
                <select id="thana" className="input" disabled={!values.district} {...register('thana', { required: 'থানা বেছে নিন' })}>
                  <option value="">নির্বাচন করুন</option>
                  {THANAS[values.district]?.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.thana && <span className="error-text">{errors.thana.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="addressLine">নির্দিষ্ট এলাকা (ঐচ্ছিক)</label>
              <input id="addressLine" className="input" placeholder="যেমন: রোড ৭, ধানমন্ডি" {...register('addressLine')} />
              <span className="help-text">নিরাপত্তার জন্য পুরো বাসার ঠিকানা দেবেন না।</span>
            </div>

            <Controller
              name="hidePhoneNumber"
              control={control}
              render={({ field }) => (
                <label className="toggle-row">
                  <span className="toggle-row__text">
                    <span className="toggle-row__title"><EyeOff size={16} /> ফোন নম্বর লুকিয়ে রাখুন</span>
                    <span className="toggle-row__desc">চালু থাকলে ক্রেতারা শুধু চ্যাটে যোগাযোগ করতে পারবে</span>
                  </span>
                  <input type="checkbox" className="switch" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                </label>
              )}
            />

            <div className="preview">
              <div className="preview__label">প্রিভিউ</div>
              <div className="preview__card">
                {uploadedImages[0] && <img src={uploadedImages[0]} alt="" />}
                <div>
                  <div className="preview__price">{formatPrice(Number(values.price) || 0)}</div>
                  <div className="preview__title">{values.title || 'শিরোনাম'}</div>
                  <div className="preview__meta">
                    {category && <span>{category.emoji} {category.label}</span>}
                    {values.condition && <span>{getConditionLabel(values.condition)}</span>}
                    {values.thana && <span><MapPin size={12} /> {values.thana}, {values.district}</span>}
                  </div>
                </div>
              </div>
            </div>

            {!initial && (
              <p className="help-text mt-3">পোস্ট করার পর আমাদের টিম বিজ্ঞাপনটি দ্রুত রিভিউ করবে। অনুমোদনের পর ৩০ দিন সক্রিয় থাকবে।</p>
            )}
          </div>
        )}

        <div className="listing-form__actions">
          {step > 0 ? (
            <button type="button" className="btn btn-outline" onClick={goBack} disabled={isSubmitting}>
              <ChevronLeft size={18} /> আগের ধাপ
            </button>
          ) : <span />}

          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              পরের ধাপ <ChevronRight size={18} />
            </button>
          ) : (
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              {isSubmitting ? 'সেভ হচ্ছে…' : submitLabel} {!isSubmitting && <CheckCircle2 size={18} />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
