import { stripHtmlTags } from './sanitize';

// Regex for matching full URLs, www prefixes, and common domain extensions
const URL_REGEX = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s]+|\b[a-zA-Z0-9.-]+\.(?:com|net|org|xyz|me|info|io|bd|gov|edu|co|biz|site|online|app|dev|link|top|club|shop|tech|store|cc|live)(?:\/[^\s]*)?/gi;

// Regex for Bangladeshi phone number patterns (with optional +88, spaces, or hyphens)
const BD_PHONE_REGEX = /(?:\+?880|0)?1[3-9](?:[\s-]?\d){8}/g;

// Keywords and patterns associated with advance payment scams
const SUSPICIOUS_PAYMENT_KEYWORDS = [
  'bkash advance',
  'nagad advance',
  'rocket advance',
  'upay advance',
  'send money first',
  'advance payment',
  'advance pay',
  'advance taka',
  'taka advance',
  'send advance',
  'age taka',
  'taka age',
  'payment advance',
  'send money before',
  'advance delivery fee',
  'delivery charge advance',
];

/**
 * Returns true if the text contains any URL/link pattern
 */
export const containsExternalLink = (text: string): boolean => {
  if (!text) return false;
  // Reset regex state before test
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
};

/**
 * Replaces Bangladeshi phone number patterns with '***** *****'
 */
export const maskPhoneNumbers = (text: string): string => {
  if (!text) return text;
  return text.replace(BD_PHONE_REGEX, '***** *****');
};

/**
 * Returns true if the text contains suspicious payment keywords
 */
export const containsSuspiciousPatterns = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return SUSPICIOUS_PAYMENT_KEYWORDS.some((keyword) => lowerText.includes(keyword));
};

/**
 * Sanitizes chat message text and produces safety warnings
 */
export const sanitizeMessage = (
  text: string
): { sanitizedText: string; warnings: string[] } => {
  const warnings: string[] = [];

  if (!text) {
    return { sanitizedText: '', warnings };
  }

  // 1. Strip HTML tags
  let sanitized = stripHtmlTags(text);

  // 2. Check for external links
  if (containsExternalLink(sanitized)) {
    sanitized = sanitized.replace(URL_REGEX, '[link removed]');
    warnings.push('External links are not allowed.');
  }

  // 3. Mask phone numbers
  sanitized = maskPhoneNumbers(sanitized);

  // 4. Check for suspicious payment patterns
  if (containsSuspiciousPatterns(sanitized) || containsSuspiciousPatterns(text)) {
    warnings.push('Caution: Never send advance payment.');
  }

  return {
    sanitizedText: sanitized.trim(),
    warnings,
  };
};
