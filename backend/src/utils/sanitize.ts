export const stripHtmlTags = (text: string): string => {
  if (!text) return text;
  // Remove HTML and JS script tags
  return text.replace(/<[^>]*>?/gm, '').trim();
};
