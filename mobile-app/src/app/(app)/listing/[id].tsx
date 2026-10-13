import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Radius, Shadows, useTheme } from '@/constants/theme';
import { WEB_LINKS } from '@/constants/api';
import { getCategoryLabel, getConditionLabel, CATEGORIES } from '@/constants/categories';
import { formatLocation } from '@/constants/locations';
import { formatDate, formatMonthYear, formatPrice, formatRelativeTime, toBanglaDigits } from '@/lib/format';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { STALE } from '@/lib/queryClient';
import { useListing } from '@/hooks/useListings';
import { useRequireVerified } from '@/hooks/useRequireVerified';
import { listingService, getSeller } from '@/services/listing.service';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { ApiError } from '@/types/api.types';
import { ListingCard } from '@/components/listing/ListingCard';
import { ModerationBadge } from '@/components/listing/ModerationBadge';
import { ReviewModal, useHasReviewed } from '@/components/listing/ReviewModal';
import { ReportModal } from '@/components/common/ReportModal';
import { AppText, Avatar, Badge, Button, EmptyState, ImageCarousel, Skeleton, StarRating } from '@/components/ui';
import type { Listing } from '@/types/listing.types';

const DESCRIPTION_PREVIEW = 200;

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <AppText variant="bodySmall" color={colors.textSecondary} style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText variant="bodySmall" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View>
      <Skeleton height={300} radius={0} />
      <View style={styles.skeletonBody}>
        <Skeleton width="40%" height={26} />
        <Skeleton width="85%" height={18} />
        <Skeleton width="60%" height={14} />
        <Skeleton height={120} radius={Radius.lg} />
        <Skeleton height={90} radius={Radius.lg} />
      </View>
    </View>
  );
}

/** Listing detail (Prompt 24) */
export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const guard = useRequireVerified();

  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewed, setReviewedLocally] = useHasReviewed(listing?.id);

  // "একই ধরনের বিজ্ঞাপন"
  const { data: similar } = useQuery({
    queryKey: ['listings', 'similar', listing?.category],
    queryFn: () => listingService.getListings({ category: listing!.category, limit: 7, sort: 'newest' }),
    enabled: !!listing?.category,
    staleTime: STALE.feed,
    select: (page) => page.listings.filter((l) => l.id !== id).slice(0, 6),
  });

  const seller = getSeller(listing);
  const isOwner = !!me && (seller?.id === me.id || listing?.sellerId === me.id);
  const isActive = listing?.status === 'active';
  const canReview =
    !!listing && !!me && listing.status === 'sold' && listing.soldToBuyerId === me.id && reviewed === false;

  const category = useMemo(() => CATEGORIES.find((c) => c.value === listing?.category), [listing?.category]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const share = async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `${listing.title} — ${formatPrice(listing.price)}\nবেচা-কেনায় দেখুন: ${WEB_LINKS.listing(listing.id)}`,
      });
    } catch {
      // user dismissed
    }
  };

  const openReport = () => {
    if (guard('report')) setReportOpen(true);
  };

  const startChat = async () => {
    if (!listing || !guard('chat')) return;
    setChatLoading(true);
    try {
      const room = await chatService.createRoom(listing.id);
      useChatStore.getState().upsertRoom(room);
      router.push(`/(app)/chat/${room.id}`);
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'SELF_CHAT_NOT_ALLOWED') toast.info('এটি আপনার নিজের বিজ্ঞাপন');
      else if (code === 'INACTIVE_LISTING') toast.warning('বিজ্ঞাপনটি আর সক্রিয় নেই, চ্যাট করা যাবে না');
      else toast.error('চ্যাট শুরু করা যায়নি', { body: getErrorMessage(err) });
    } finally {
      setChatLoading(false);
    }
  };

  const call = () => {
    if (!seller?.phoneNumber) return;
    Linking.openURL(`tel:${seller.phoneNumber}`).catch(() => toast.error('কল করা যায়নি'));
  };

  // ─── Top buttons over the carousel ─────────────────────────────────────────
  const topBar = (
    <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable onPress={() => router.back()} style={[styles.circleBtn, Shadows.sm]} accessibilityLabel="ফিরে যান">
        <Ionicons name="arrow-back" size={22} color="#1B2420" />
      </Pressable>
      {listing ? (
        <View style={styles.topRight}>
          <Pressable onPress={share} style={[styles.circleBtn, Shadows.sm]} accessibilityLabel="শেয়ার করুন">
            <Ionicons name="share-social-outline" size={20} color="#1B2420" />
          </Pressable>
          {!isOwner ? (
            <Pressable onPress={openReport} style={[styles.circleBtn, Shadows.sm]} accessibilityLabel="রিপোর্ট করুন">
              <Ionicons name="flag-outline" size={20} color="#DC2626" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  // ─── Loading / error ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DetailSkeleton />
        {topBar}
      </View>
    );
  }

  if (isError || !listing) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <EmptyState
          variant={notFound ? 'noResults' : 'error'}
          title={notFound ? 'বিজ্ঞাপনটি পাওয়া যায়নি' : undefined}
          subtitle={notFound ? 'মুছে ফেলা হয়েছে বা রিভিউতে আছে' : getErrorMessage(error)}
          actionLabel={notFound ? 'ফিরে যান' : 'আবার চেষ্টা করুন'}
          onAction={notFound ? () => router.back() : () => refetch()}
        />
        {topBar}
      </View>
    );
  }

  const description = listing.description ?? '';
  const longDescription = description.length > DESCRIPTION_PREVIEW;
  const shownDescription = expanded || !longDescription ? description : `${description.slice(0, DESCRIPTION_PREVIEW).trim()}…`;
  const area = [listing.location?.thana, listing.location?.district, listing.location?.division].filter(Boolean).join(', ');

  // ─── Bottom bar ────────────────────────────────────────────────────────────
  let bottomBar: React.ReactNode = null;
  if (isOwner) {
    bottomBar = (
      <View style={styles.bottomRow}>
        {listing.status === 'active' || listing.status === 'pending' ? (
          <Button
            title="এডিট"
            variant="outline"
            leftIcon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
            onPress={() => router.push(`/(app)/listing/edit/${listing.id}`)}
            style={styles.flex}
          />
        ) : null}
        <Button title="আমার বিজ্ঞাপন" onPress={() => router.push('/(app)/my-listings')} style={styles.flex} />
      </View>
    );
  } else if (isActive) {
    const callButton = listing.hidePhoneNumber ? null : !me?.isVerified ? (
      <Button
        title="নম্বর দেখতে যাচাই করুন"
        variant="outline"
        size="md"
        leftIcon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
        onPress={() => router.push('/(app)/kyc')}
        style={styles.flex}
      />
    ) : seller?.phoneNumber ? (
      <Button
        title="কল করুন"
        variant="outline"
        leftIcon={<Ionicons name="call" size={18} color={colors.primary} />}
        onPress={call}
        style={styles.flex}
      />
    ) : null;

    bottomBar = (
      <View>
        {listing.hidePhoneNumber ? (
          <AppText variant="caption" color={colors.textSecondary} align="center" style={styles.chatOnly}>
            🔒 বিক্রেতা শুধু চ্যাটে যোগাযোগ করতে চান
          </AppText>
        ) : null}
        <View style={styles.bottomRow}>
          {callButton}
          <Button
            title="চ্যাট করুন"
            leftIcon={<Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />}
            onPress={startChat}
            loading={chatLoading}
            style={callButton ? styles.flex : styles.full}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomBar ? 24 : insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* 1. Images */}
        <ImageCarousel
          images={listing.images}
          height={320}
          overlay={
            listing.status === 'sold' ? (
              <View style={styles.soldOverlay} pointerEvents="none">
                <AppText style={styles.soldText}>বিক্রি হয়ে গেছে</AppText>
              </View>
            ) : null
          }
        />

        <View style={styles.body}>
          {/* Owner-only notice for ads others cannot see */}
          {isOwner && listing.status !== 'active' ? (
            <View style={[styles.notice, { backgroundColor: colors.secondarySoft }]}>
              <ModerationBadge listing={listing} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
                {listing.status === 'pending'
                  ? 'এই বিজ্ঞাপনটি রিভিউতে আছে — অনুমোদনের পর সবাই দেখতে পাবে।'
                  : listing.status === 'archived'
                  ? 'এই বিজ্ঞাপনটি আর্কাইভড — শুধু আপনি দেখতে পাচ্ছেন।'
                  : 'এই বিজ্ঞাপনটি বিক্রিত হিসেবে চিহ্নিত।'}
              </AppText>
            </View>
          ) : null}

          {/* 2. Price, title, badges */}
          <AppText variant="heading1" color={colors.primary}>
            {formatPrice(listing.price)}
          </AppText>
          <AppText variant="heading3" style={styles.title}>
            {listing.title}
          </AppText>
          <View style={styles.badgeRow}>
            <Badge label={getConditionLabel(listing.condition)} variant={listing.condition === 'new' ? 'green' : listing.condition === 'like_new' ? 'yellow' : 'neutral'} />
            <Badge label={`${category?.emoji ?? '📦'} ${getCategoryLabel(listing.category)}`} variant="blue" />
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {formatLocation(listing.location) || 'বাংলাদেশ'}
            </AppText>
            <AppText variant="bodySmall" color={colors.textMuted}>
              •  {formatRelativeTime(listing.createdAt)}
            </AppText>
          </View>

          {/* Review prompt for the buyer of a sold ad */}
          {canReview && seller ? (
            <Pressable
              onPress={() => setReviewOpen(true)}
              style={[styles.reviewPrompt, { backgroundColor: colors.secondarySoft, borderColor: colors.secondary }]}
            >
              <Ionicons name="star" size={22} color={colors.secondary} />
              <View style={styles.flex}>
                <AppText variant="body" style={styles.bold}>
                  আপনি পণ্যটি কিনেছেন!
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  বিক্রেতাকে রিভিউ দিয়ে অন্যদের সাহায্য করুন
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}

          {/* 3. Details + description */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="heading3" style={styles.cardTitle}>
              বিস্তারিত
            </AppText>
            <DetailRow label="ক্যাটাগরি" value={getCategoryLabel(listing.category)} />
            <DetailRow label="অবস্থা" value={getConditionLabel(listing.condition)} />
            <DetailRow label="এলাকা" value={area || 'বাংলাদেশ'} />
            <DetailRow label="পোস্টের তারিখ" value={formatDate(listing.createdAt, 'd MMMM yyyy')} />
            <AppText variant="body" style={styles.description} selectable>
              {shownDescription}
            </AppText>
            {longDescription ? (
              <Pressable onPress={() => setExpanded((e) => !e)} hitSlop={6}>
                <AppText variant="bodySmall" color={colors.primary} style={styles.bold}>
                  {expanded ? 'কম দেখুন' : 'আরো দেখুন'}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          {/* 4. Seller */}
          {seller ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="heading3" style={styles.cardTitle}>
                বিক্রেতা
              </AppText>
              <View style={styles.sellerRow}>
                <Avatar name={seller.displayName} size={54} verified={seller.isVerified} />
                <View style={styles.flex}>
                  <AppText variant="body" style={styles.bold} numberOfLines={1}>
                    {seller.displayName}
                  </AppText>
                  {seller.isVerified ? (
                    <View style={styles.inlineRow}>
                      <Ionicons name="shield-checkmark" size={14} color={colors.verified} />
                      <AppText variant="caption" color={colors.verified} style={styles.bold}>
                        NID ভেরিফাইড
                      </AppText>
                    </View>
                  ) : null}
                  {seller.verifiedName ? (
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      আইনগত নাম: {seller.verifiedName}
                    </AppText>
                  ) : null}
                </View>
              </View>
              <View style={styles.sellerStats}>
                {seller.totalReviews > 0 ? (
                  <View style={styles.inlineRow}>
                    <StarRating value={seller.averageRating} readOnly allowHalf size={14} />
                    <AppText variant="caption" color={colors.textSecondary}>
                      {toBanglaDigits(seller.averageRating.toFixed(1))} ({toBanglaDigits(seller.totalReviews)} রিভিউ)
                    </AppText>
                  </View>
                ) : (
                  <AppText variant="caption" color={colors.textMuted}>
                    এখনো রিভিউ নেই
                  </AppText>
                )}
                <AppText variant="caption" color={colors.textMuted}>
                  সদস্য: {formatMonthYear(seller.createdAt)}
                </AppText>
              </View>
              <Button
                title="প্রোফাইল দেখুন"
                variant="outline"
                size="sm"
                onPress={() => router.push(`/(app)/user/${seller.id}`)}
                fullWidth
              />
            </View>
          ) : null}

          {/* 5. Approximate location */}
          <View style={[styles.card, styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.locationIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="map-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="body" style={styles.bold}>
                {area || 'বাংলাদেশ'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                আনুমানিক এলাকা — সঠিক ঠিকানা চ্যাটে জেনে নিন
              </AppText>
            </View>
          </View>

          {/* 6. Safety */}
          <View style={[styles.safety, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
            <AppText variant="bodySmall" style={styles.flex}>
              ⚠️ জনবহুল জায়গায় দেখা করুন। পণ্য না দেখে বিকাশ/নগদে অগ্রিম টাকা পাঠাবেন না।
            </AppText>
          </View>
        </View>

        {/* 7. Similar ads */}
        {similar && similar.length ? (
          <View>
            <AppText variant="heading3" style={styles.similarTitle}>
              একই ধরনের বিজ্ঞাপন
            </AppText>
            <FlatList<Listing>
              data={similar}
              horizontal
              keyExtractor={(l) => l.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
              renderItem={({ item }) => (
                <View style={styles.similarItem}>
                  <ListingCard listing={item} variant="grid" />
                </View>
              )}
            />
          </View>
        ) : null}
      </ScrollView>

      {bottomBar ? (
        <View
          style={[
            styles.bottomBar,
            Shadows.md,
            { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {bottomBar}
        </View>
      ) : null}

      {topBar}

      <ReportModal
        targetType="Listing"
        targetId={listing.id}
        targetName={listing.title}
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
      />

      {seller ? (
        <ReviewModal
          visible={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onReviewed={setReviewedLocally}
          target={{
            listingId: listing.id,
            title: listing.title,
            image: listing.images[0],
            price: listing.price,
            sellerId: seller.id,
            sellerName: seller.displayName,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center' },
  flex: { flex: 1 },
  full: { flex: 1 },
  bold: { fontWeight: '600' },
  topBar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  topRight: { flexDirection: 'row', gap: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  body: { padding: 16, gap: 8 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: Radius.md, marginBottom: 4 },
  title: { marginTop: -2 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reviewPrompt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.lg, borderWidth: 1, marginTop: 8 },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: 16, marginTop: 8, gap: 4 },
  cardTitle: { marginBottom: 6 },
  detailRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  detailLabel: { width: 110 },
  detailValue: { flex: 1, fontWeight: '500' },
  description: { marginTop: 12, lineHeight: 24 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  safety: { borderRadius: Radius.md, borderWidth: 1, padding: 12, marginTop: 8 },
  similarTitle: { paddingHorizontal: 16, marginTop: 8, marginBottom: 4 },
  similarList: { paddingHorizontal: 8 },
  similarItem: { width: 180 },
  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 10 },
  bottomRow: { flexDirection: 'row', gap: 10 },
  chatOnly: { marginBottom: 8 },
  skeletonBody: { padding: 16, gap: 12 },
});
