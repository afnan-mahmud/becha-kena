import { format, formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export const formatPrice = (price: number): string => {
  const formatted = new Intl.NumberFormat('bn-BD').format(price);
  return `৳${formatted}`;
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: bn });
  } catch (e) {
    return '';
  }
};

export const formatDate = (date: string | Date): string => {
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: bn });
  } catch (e) {
    return '';
  }
};
