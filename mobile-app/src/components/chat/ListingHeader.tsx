import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/constants/theme';
import { formatPrice } from '@/lib/format';
import { AppText, Badge } from '@/components/ui';
import type { ChatRoomListing } from '@/types/chat.types';

const STATUS_LABEL: Record<string, { label: string; variant: 'yellow' | 'blue' | 'neutral' }> = {
  pending: { label: 'রিভিউতে', variant: 'yellow' },
  sold: { label: 'বিক্রিত', variant: 'blue' },
  archived: { label: 'আর্কাইভড', variant: 'neutral' },
};

/** Compact listing card under the chat header (Prompt 31) — tap opens the ad */
export function ListingHeader({ listing }: { listing: ChatRoomListing | null }) {
  const { colors } = useTheme();
  if (!listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <AppText variant="bodySmall" color={colors.textMuted}>
          বিজ্ঞাপনটি মুছে ফেলা হয়েছে
        </AppText>
      </View>
    );
  }
  const status = STATUS_LABEL[listing.status];
  return (
    <Pressable
      onPress={() => router.push(`/(app)/listing/${listing.id}`)}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.backgroundSubtle : colors.surface, borderBottomColor: colors.border },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`বিজ্ঞাপন: ${listing.title}`}
    >
      <Image source={{ uri: listing.images?.[0] }} style={[styles.thumb, { backgroundColor: colors.backgroundSubtle }]} contentFit="cover" cachePolicy="memory-disk" />
      <View style={styles.texts}>
        <AppText variant="bodySmall" numberOfLines={1} style={styles.title}>
          {listing.title}
        </AppText>
        <AppText variant="bodySmall" color={colors.primary} style={styles.price}>
          {formatPrice(listing.price)}
        </AppText>
      </View>
      {status ? <Badge size="sm" label={status.label} variant={status.variant} /> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 42, height: 42, borderRadius: 8 },
  texts: { flex: 1 },
  title: { fontWeight: '600' },
  price: { fontWeight: '700' },
});

export default ListingHeader;
