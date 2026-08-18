export const BLOCKED_KEYWORDS = [
  'weapon',
  'drug',
  'gun',
  'cocaine',
  'counterfeit',
  'replica',
  'xxx',
  'porn',
];

export const checkBlockedKeywords = (text: string): string | null => {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }
  return null;
};