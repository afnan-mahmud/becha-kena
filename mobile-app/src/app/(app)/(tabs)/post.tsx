import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useCreateListing } from '@/hooks/useListings';
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner';
import { ListingForm } from '@/components/listing/ListingForm';
import { AdSubmitSuccess } from '@/components/listing/AdSubmitSuccess';
import { AppText, Button } from '@/components/ui';

export default function PostScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isVerified = useAuthStore((state) => state.user?.isVerified ?? false);
  const createListing = useCreateListing();
  const [showSuccess, setShowSuccess] = useState(false);
  // remount the form after "আরেকটি বিজ্ঞাপন দিন"
  const [formKey, setFormKey] = useState(0);

  // Guard: only NID-verified users can post
  if (!isVerified) {
    return (
      <View style={[styles.guard, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
        <View style={[styles.guardIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="shield-checkmark" size={44} color={colors.primary} />
        </View>
        <AppText variant="heading2" align="center">
          বিজ্ঞাপন দিতে যাচাই করুন
        </AppText>
        <AppText variant="body" align="center" color={colors.textSecondary} style={styles.guardText}>
          বেচা-কেনায় শুধু NID-যাচাইকৃত বিক্রেতারা বিজ্ঞাপন দিতে পারেন — তাই ক্রেতারা নিশ্চিন্তে কিনতে পারেন।
        </AppText>
        <View style={styles.bannerWrap}>
          <KYCStatusBanner />
        </View>
        <Button
          title="বিজ্ঞাপন দিতে আগে NID দিয়ে যাচাই করুন"
          onPress={() => router.push('/(app)/kyc')}
          fullWidth
          size="lg"
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="heading2">বিজ্ঞাপন দিন</AppText>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          ৪টি সহজ ধাপে আপনার পণ্য বিক্রি করুন
        </AppText>
      </View>

      <ListingForm
        key={formKey}
        onSubmit={async (body) => {
          await createListing.mutateAsync(body); // 201 → status "pending"
          setShowSuccess(true);
        }}
      />

      <AdSubmitSuccess
        visible={showSuccess}
        onViewMyAds={() => {
          setShowSuccess(false);
          router.push({ pathname: '/(app)/my-listings', params: { tab: 'pending' } });
        }}
        onPostAnother={() => {
          setShowSuccess(false);
          setFormKey((k) => k + 1);
        }}
        onGoHome={() => {
          setShowSuccess(false);
          router.navigate('/(app)/(tabs)/home');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  guard: { flex: 1, padding: 24, alignItems: 'center' },
  guardIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guardText: { marginTop: 8, marginBottom: 20 },
  bannerWrap: { alignSelf: 'stretch', marginBottom: 16 },
});
