import type { ListingConditionValue, ReportReason } from '../types';

export interface CategoryOption {
  /** Value stored in the database — must stay identical across web & mobile */
  value: string;
  label: string;
  emoji: string;
  /** Tile tint used on the home page */
  tint: string;
}

export const CATEGORIES: CategoryOption[] = [
  { value: 'Mobile', label: 'মোবাইল', emoji: '📱', tint: '#E7F6EF' },
  { value: 'Electronics', label: 'ইলেকট্রনিক্স', emoji: '💻', tint: '#E8F0FE' },
  { value: 'Vehicles', label: 'গাড়ি ও বাইক', emoji: '🏍️', tint: '#FDECEC' },
  { value: 'Furniture', label: 'আসবাবপত্র', emoji: '🛋️', tint: '#FFF4DB' },
  { value: 'Cycles', label: 'সাইকেল', emoji: '🚲', tint: '#E9F7F6' },
  { value: 'Fashion', label: 'ফ্যাশন', emoji: '👗', tint: '#FCE9F3' },
  { value: 'Health & Beauty', label: 'স্বাস্থ্য ও সৌন্দর্য', emoji: '💄', tint: '#F3ECFD' },
  { value: 'Food & Restaurant', label: 'খাবার', emoji: '🍛', tint: '#FFF0E3' },
  { value: 'Travel', label: 'ভ্রমণ', emoji: '🧳', tint: '#E6F4FB' },
  { value: 'Sports & Outdoors', label: 'খেলাধুলা', emoji: '🏏', tint: '#EEF6E4' },
  { value: 'Other', label: 'অন্যান্য', emoji: '📦', tint: '#F1F1EE' },
];

export const getCategory = (value?: string) => CATEGORIES.find((c) => c.value === value);
export const getCategoryLabel = (value?: string) => getCategory(value)?.label || value || '';

export const CONDITIONS: { value: ListingConditionValue; label: string }[] = [
  { value: 'new', label: 'নতুন' },
  { value: 'like_new', label: 'প্রায় নতুন' },
  { value: 'used', label: 'ব্যবহৃত' },
];

export const getConditionLabel = (value?: string) =>
  CONDITIONS.find((c) => c.value === value)?.label || '';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'scam', label: 'প্রতারণা / স্ক্যাম' },
  { value: 'harassment', label: 'হয়রানি বা খারাপ আচরণ' },
  { value: 'misrepresentation', label: 'ভুল দাম বা ভুল বর্ণনা' },
  { value: 'inappropriate', label: 'অনুপযুক্ত কন্টেন্ট' },
  { value: 'other', label: 'অন্যান্য' },
];

export const getReportReasonLabel = (value?: string) =>
  REPORT_REASONS.find((r) => r.value === value)?.label || value || '';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'নতুন আগে' },
  { value: 'price_low', label: 'দাম: কম থেকে বেশি' },
  { value: 'price_high', label: 'দাম: বেশি থেকে কম' },
  { value: 'oldest', label: 'পুরনো আগে' },
] as const;

export const LISTING_LIMITS = {
  titleMin: 10,
  titleMax: 80,
  descriptionMin: 20,
  descriptionMax: 1000,
  maxImages: 10,
};

/** Inline SVG so missing images never depend on an external placeholder service */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F1EEE7"/><g fill="none" stroke="#B9B2A3" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><rect x="140" y="95" width="120" height="100" rx="14"/><circle cx="178" cy="132" r="12"/><path d="M150 185l38-36 26 22 18-14 28 28"/></g></svg>`
  );
