import { formatDistanceToNow, isToday, isYesterday, isThisYear, format } from 'date-fns';
import { bn } from 'date-fns/locale/bn';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BANGLA_MONTHS_SHORT = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];

/**
 * Convert ASCII numbers/digits to Bengali digits
 */
export const toBanglaDigits = (num: number | string): string => {
  return String(num).replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)]);
};

/**
 * Manual fallback for Indian digit grouping with Bangla numerals
 */
const formatIndianGroupingBangla = (num: number): string => {
  const parts = Math.round(num).toString().split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const grouped =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return toBanglaDigits(grouped);
};

/**
 * Format currency with Bangla digits and Indian grouping
 * Example: formatPrice(68000) -> "৳৬৮,০০০"
 */
export const formatPrice = (price: number): string => {
  if (isNaN(price) || price === null || price === undefined) {
    return '৳০';
  }
  try {
    const formatted = new Intl.NumberFormat('bn-BD').format(price);
    // Check if Intl gave English or Bangla digits
    if (/[0-9]/.test(formatted)) {
      return `৳${toBanglaDigits(formatted)}`;
    }
    return `৳${formatted}`;
  } catch {
    return `৳${formatIndianGroupingBangla(price)}`;
  }
};

/**
 * Format relative time in Bangla
 * Example: "৫ মিনিট আগে", "২ ঘণ্টা আগে"
 */
export const formatRelativeTime = (dateInput: Date | string | number): string => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return formatDistanceToNow(date, { addSuffix: true, locale: bn });
  } catch {
    return '';
  }
};

/**
 * Format chat message timestamps
 * - Today: "১০:৩০ AM"
 * - Yesterday: "গতকাল"
 * - This year: "১২ অক্টো"
 * - Earlier: "১২ অক্টো ২০২৪"
 */
export const formatChatTime = (dateInput: Date | string | number): string => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    if (isToday(d)) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${toBanglaDigits(h12)}:${toBanglaDigits(minStr)} ${period}`;
    }

    if (isYesterday(d)) {
      return 'গতকাল';
    }

    const day = toBanglaDigits(d.getDate());
    const month = BANGLA_MONTHS_SHORT[d.getMonth()];

    if (isThisYear(d)) {
      return `${day} ${month}`;
    }

    const year = toBanglaDigits(d.getFullYear());
    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
};

/**
 * Format date in localized Bangla string
 * Example: formatDate(new Date()) -> "১২ অক্টোবর ২০২৬"
 */
export const formatDate = (
  dateInput: Date | string | number,
  formatStr: string = 'dd MMMM yyyy'
): string => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return format(d, formatStr, { locale: bn });
  } catch {
    return '';
  }
};

/**
 * Mask Bangladeshi phone number for privacy
 * Example: maskPhone("+8801712345678") -> "017•••••678"
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/^(\+?88)/, '').trim();
  if (cleaned.length < 7) return cleaned;
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-3);
  return `${start}•••••${end}`;
};

/**
 * Distance in meters → "২.৪ কিমি দূরে" / "৮৫০ মিটার দূরে"
 */
export const formatDistance = (meters?: number | null): string => {
  if (meters === undefined || meters === null || isNaN(meters)) return '';
  if (meters < 1000) return `${toBanglaDigits(Math.max(1, Math.round(meters / 10) * 10))} মিটার দূরে`;
  const km = meters / 1000;
  return `${toBanglaDigits(km < 10 ? km.toFixed(1) : Math.round(km))} কিমি দূরে`;
};

/**
 * Days left until a date (ceil). Negative when already past.
 */
export const daysUntil = (dateInput: Date | string | number): number => {
  const ms = new Date(dateInput).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
};

/**
 * "সদস্য: জুন ২০২৫" style month + year
 */
export const formatMonthYear = (dateInput: Date | string | number): string =>
  formatDate(dateInput, 'MMMM yyyy');
