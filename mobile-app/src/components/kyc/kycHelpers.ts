/**
 * Shared KYC utility functions and constants.
 * Used by both adult.tsx and minor.tsx.
 */

export const VALID_NID_LENGTHS = [10, 13, 17];

export function validateNid(nid: string): string | null {
  if (!/^\d+$/.test(nid)) return 'NID নম্বরে শুধু সংখ্যা থাকতে হবে';
  if (!VALID_NID_LENGTHS.includes(nid.length))
    return 'NID নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে';
  return null;
}

export function maskNid(nid: string): string {
  if (nid.length <= 4) return nid;
  return '•'.repeat(nid.length - 4) + nid.slice(-4);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns true if the person is at least 18 years old. */
export function isAdult(dob: Date): boolean {
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}

/** Returns true if the person is strictly under 18 years old. */
export function isMinor(dob: Date): boolean {
  return !isAdult(dob);
}
