import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { bn } from 'date-fns/locale';

export const formatPrice = (price: number): string => {
  const formatted = new Intl.NumberFormat('bn-BD').format(price || 0);
  return `৳${formatted}`;
};

export const formatNumber = (value: number): string => new Intl.NumberFormat('bn-BD').format(value || 0);

export const formatRelativeTime = (date: string | Date): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: bn });
  } catch {
    return '';
  }
};

export const formatDate = (date: string | Date): string => {
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: bn });
  } catch {
    return '';
  }
};

export const formatChatTime = (date: string | Date): string => {
  try {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a', { locale: bn });
    if (isYesterday(d)) return 'গতকাল';
    return format(d, 'd MMM', { locale: bn });
  } catch {
    return '';
  }
};

export const formatDayLabel = (date: string | Date): string => {
  try {
    const d = new Date(date);
    if (isToday(d)) return 'আজ';
    if (isYesterday(d)) return 'গতকাল';
    return format(d, 'd MMMM yyyy', { locale: bn });
  } catch {
    return '';
  }
};

export const maskPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const local = phone.replace(/^\+88/, '');
  return local.length === 11 ? `${local.slice(0, 3)}•••••${local.slice(-3)}` : local;
};

export const getErrorMessage = (error: unknown, fallback = 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।'): string =>
  error instanceof Error && error.message ? error.message : fallback;
