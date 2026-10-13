import AsyncStorage from '@react-native-async-storage/async-storage';

/** Listing ids this account already reviewed — hides the "রিভিউ দিন" prompt (Prompt 34) */
const KEY = 'bk_reviewed_listings';

const read = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const hasReviewed = async (listingId: string) => (await read()).includes(listingId);

export const markReviewed = async (listingId: string) => {
  const ids = await read();
  if (!ids.includes(listingId)) {
    await AsyncStorage.setItem(KEY, JSON.stringify([...ids, listingId].slice(-200)));
  }
};
