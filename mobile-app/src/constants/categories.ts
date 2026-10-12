export const CATEGORIES = [
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
] as const;

export const CONDITIONS = [
  { value: 'new', label: 'নতুন' },
  { value: 'like_new', label: 'প্রায় নতুন' },
  { value: 'used', label: 'ব্যবহৃত' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
export type ConditionValue = (typeof CONDITIONS)[number]['value'];

export const getCategoryLabel = (value: string): string => {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
};

export const getConditionLabel = (value: string): string => {
  const cond = CONDITIONS.find((c) => c.value === value);
  return cond ? cond.label : value;
};
