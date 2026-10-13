import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useListing, useUpdateListing } from '@/hooks/useListings';
import { getSeller } from '@/services/listing.service';
import { toast } from '@/lib/toast';
import { ListingForm } from '@/components/listing/ListingForm';
import { EmptyState, FullScreenLoader } from '@/components/ui';

/** Edit an active / pending ad (Prompt 22) */
export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const myId = useAuthStore((s) => s.user?.id);
  const { data: listing, isLoading, isError, refetch } = useListing(id);
  const updateListing = useUpdateListing();

  if (isLoading) return <FullScreenLoader />;
  if (isError || !listing) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState variant="error" title="বিজ্ঞাপনটি লোড করা যায়নি" onAction={() => refetch()} />
      </View>
    );
  }

  const sellerId = getSeller(listing)?.id ?? (typeof listing.sellerId === 'string' ? listing.sellerId : undefined);
  if (sellerId !== myId) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState variant="error" title="এই বিজ্ঞাপনটি এডিট করার অনুমতি নেই" />
      </View>
    );
  }

  if (listing.status !== 'active' && listing.status !== 'pending') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <EmptyState
          variant="noListings"
          title="এই বিজ্ঞাপনটি আর এডিট করা যাবে না"
          subtitle="শুধু সক্রিয় বা রিভিউতে থাকা বিজ্ঞাপন এডিট করা যায়।"
          actionLabel="ফিরে যান"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const wasActive = listing.status === 'active';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ListingForm
        initial={listing}
        submitLabel="পরিবর্তন সংরক্ষণ করুন"
        onSubmit={async (body) => {
          const updated = await updateListing.mutateAsync({ id: listing.id, body });
          if (wasActive && updated.status === 'pending') {
            // A new title or a >20% price change sends the ad back to moderation
            Alert.alert('আবার রিভিউতে গেছে', 'বড় পরিবর্তনের কারণে বিজ্ঞাপনটি আবার রিভিউতে গেছে');
          } else {
            toast.success('বিজ্ঞাপন আপডেট হয়েছে');
          }
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
