/**
 * Validation utilities for Bangladeshi inputs and marketplace data
 */

export const BD_PHONE_REGEX = /^(?:\+88|88)?(01[3-9]\d{8})$/;

/**
 * Validate a Bangladeshi phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  return BD_PHONE_REGEX.test(phone.trim());
};

/**
 * Normalize a Bangladeshi phone number to E.164 format (+8801XXXXXXXXX)
 */
export const normalizePhone = (phone: string): string => {
  const match = phone.trim().match(BD_PHONE_REGEX);
  if (!match) return phone.trim();
  const nationalPart = match[1]; // 01XXXXXXXXX
  return `+88${nationalPart}`;
};

/**
 * Validate 6-digit OTP code
 */
export const isValidOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp.trim());
};

/**
 * Validate National Identity Number (NID: 10, 13, or 17 digits)
 */
export const isValidNid = (nid: string): boolean => {
  const cleaned = nid.trim();
  return /^(?:\d{10}|\d{13}|\d{17})$/.test(cleaned);
};

/**
 * Strip HTML tags from a string
 */
export const stripHtml = (text: string): string => {
  return text.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * Sanitize and validate display name (1-30 characters, stripped HTML)
 */
export const sanitizeDisplayName = (name: string): string => {
  return stripHtml(name).slice(0, 30);
};

export const isValidDisplayName = (name: string): boolean => {
  const clean = sanitizeDisplayName(name);
  return clean.length >= 1 && clean.length <= 30;
};

export interface ListingValidationInput {
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate listing creation/update input
 * - title: 10-80 chars
 * - description: 20-1000 chars
 * - price: number >= 0
 * - images: 1-10 items
 */
export const validateListing = (data: ListingValidationInput): ValidationResult => {
  const errors: Record<string, string> = {};

  const title = data.title?.trim() || '';
  if (title.length < 10) {
    errors.title = 'শিরোনাম অন্তত ১০ অক্ষরের হতে হবে';
  } else if (title.length > 80) {
    errors.title = 'শিরোনাম সর্বোচ্চ ৮০ অক্ষরের হতে পারবে';
  }

  const description = data.description?.trim() || '';
  if (description.length < 20) {
    errors.description = 'বিবরণ অন্তত ২০ অক্ষরের হতে হবে';
  } else if (description.length > 1000) {
    errors.description = 'বিবরণ সর্বোচ্চ ১০০০ অক্ষরের হতে পারবে';
  }

  if (data.price === undefined || data.price === null || isNaN(data.price)) {
    errors.price = 'মূল্য নির্ধারণ করুন';
  } else if (data.price < 0) {
    errors.price = 'মূল্য ০ বা তার বেশি হতে হবে';
  }

  const images = data.images || [];
  if (images.length < 1) {
    errors.images = 'অন্তত ১টি ছবি যোগ করুন';
  } else if (images.length > 10) {
    errors.images = 'সর্বোচ্চ ১০টি ছবি যোগ করা যাবে';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
