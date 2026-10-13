import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { listingService } from '@/services/listing.service';
import { STALE } from '@/lib/queryClient';
import { Listing } from '@/types/listing.types';
import { getSeller } from '@/services/listing.service';
import { getCategoryLabel, getConditionLabel } from '@/constants/categories';
import { formatDistance, formatPrice, formatRelativeTime, toBanglaDigits } from '@/lib/format';
import { useTheme, FontFamilies } from '@/constants/theme';

export interface ListingCardProps {
  listing: Listing;
  variant?: 'grid' | 'list';
  onPress?: () => void;
  /** Position in the list — the first 10 cards fade/slide in with a small stagger */
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BLURHASH_PLACEHOLDER = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const ConditionBadge = ({ condition }: { condition: string }) => {
  const label = getConditionLabel(condition);

  let bg = '#FFFFFF';
  let textColor = '#1B2420';
  let borderColor = '#E7E3DA';

  if (condition === 'new') {
    bg = '#16A34A'; // green
    textColor = '#FFFFFF';
    borderColor = '#16A34A';
  } else if (condition === 'like_new') {
    bg = '#F4B400'; // marigold
    textColor = '#1B2420';
    borderColor = '#F4B400';
  } else {
    // used (ব্যবহৃত = white)
    bg = '#FFFFFF';
    textColor = '#1B2420';
    borderColor = '#E7E3DA';
  }

  return (
    <View
      style={[
        styles.conditionBadge,
        { backgroundColor: bg, borderColor },
      ]}
    >
      <Text style={[styles.conditionText, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
};

export const ListingCard = React.memo(function ListingCard({
  listing,
  variant = 'grid',
  onPress,
  index,
}: ListingCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const entering =
    index !== undefined && index < 10 && !reduceMotion
      ? FadeInDown.delay(index * 40).duration(300)
      : undefined;
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const seller = getSeller(listing);
  const isSold = listing.status === 'sold';
  const firstImage = listing.images?.[0];
  const photoCount = listing.images?.length || 0;

  const handlePressIn = () => {
    // Press-in scale animation (0.97)
    if (!reduceMotion) scale.value = withSpring(0.97, { damping: 12, stiffness: 300 });
    // Warm the detail screen's cache while the finger is still down (Prompt 49)
    queryClient.prefetchQuery({
      queryKey: ['listing', listing.id],
      queryFn: () => listingService.getListing(listing.id),
      staleTime: STALE.listing,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/listing/${listing.id}` as any);
    }
  };

  const locationText = [
    listing.location?.thana,
    listing.location?.district || listing.location?.division || 'বাংলাদেশ',
  ]
    .filter(Boolean)
    .join(', ');

  const timeText = formatRelativeTime(listing.createdAt);
  const distanceText = formatDistance(listing.distance);

  // -------------------------------------------------------------
  // List Variant (Search results, 110px square thumbnail)
  // -------------------------------------------------------------
  if (variant === 'list') {
    return (
      <AnimatedPressable
        entering={entering}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.listPressable}
        accessibilityRole="button"
        accessibilityLabel={`${listing.title}, ${formatPrice(listing.price)}`}
      >
        <Animated.View
          style={[
            styles.listContainer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E7E3DA',
            },
            animatedStyle,
          ]}
        >
          {/* 110px Square Thumbnail */}
          <View style={styles.listImageWrapper}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={styles.listThumbnail}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
                cachePolicy="memory-disk"
                recyclingKey={firstImage}
              />
            ) : (
              <View style={[styles.listThumbnail, styles.noImageContainer]}>
                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              </View>
            )}

            {isSold && (
              <View style={styles.soldOverlay}>
                <Text style={styles.soldText}>বিক্রি হয়ে গেছে</Text>
              </View>
            )}
          </View>

          {/* Right Details: Price, Title, Badges, Location, Time */}
          <View style={styles.listDetails}>
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {formatPrice(listing.price)}
            </Text>

            <Text
              style={[
                styles.titleText,
                { color: isDark ? colors.text : '#1B2420' },
              ]}
              numberOfLines={2}
            >
              {listing.title}
            </Text>

            {/* Condition + Category Badges */}
            <View style={styles.badgeRow}>
              <ConditionBadge condition={listing.condition} />
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: isDark ? '#143828' : '#E3F3EC',
                    borderColor: isDark ? '#263830' : '#D5E9E0',
                  },
                ]}
              >
                <Text
                  style={[styles.categoryBadgeText, { color: colors.primary }]}
                >
                  {getCategoryLabel(listing.category)}
                </Text>
              </View>
            </View>

            {/* Location & Time */}
            <Text
              style={[styles.metaText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {distanceText || locationText} • {timeText}
            </Text>
          </View>
        </Animated.View>
      </AnimatedPressable>
    );
  }

  // -------------------------------------------------------------
  // Grid Variant (Home feed, 2 columns, 4:3 Image)
  // -------------------------------------------------------------
  return (
    <AnimatedPressable
      entering={entering}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.gridPressable}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatPrice(listing.price)}`}
    >
      <Animated.View
        style={[
          styles.gridContainer,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E7E3DA',
          },
          animatedStyle,
        ]}
      >
        {/* 4:3 Image */}
        <View style={styles.gridImageWrapper}>
          {firstImage ? (
            <Image
              source={{ uri: firstImage }}
              style={styles.gridImage}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
              cachePolicy="memory-disk"
              recyclingKey={firstImage}
            />
          ) : (
            <View style={[styles.gridImage, styles.noImageContainer]}>
              <Ionicons name="image-outline" size={36} color={colors.textMuted} />
            </View>
          )}

          {/* Condition Pill on the image */}
          <View style={styles.badgeTopLeft}>
            <ConditionBadge condition={listing.condition} />
          </View>

          {/* "+N" Photo Count badge */}
          {photoCount > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="camera" size={11} color="#FFFFFF" />
              <Text style={styles.photoCountText}>
                +{toBanglaDigits(photoCount - 1)}
              </Text>
            </View>
          )}

          {/* Dark Sold Overlay */}
          {isSold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>বিক্রি হয়ে গেছে</Text>
            </View>
          )}
        </View>

        {/* Content below image */}
        <View style={styles.gridContent}>
          {/* Price below in bold green */}
          <Text style={[styles.priceText, { color: colors.primary }]}>
            {formatPrice(listing.price)}
          </Text>

          {/* Title (2 lines) */}
          <Text
            style={[
              styles.titleText,
              { color: isDark ? colors.text : '#1B2420' },
            ]}
            numberOfLines={2}
          >
            {listing.title}
          </Text>

          {/* Location + relative time */}
          <Text
            style={[styles.metaText, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {locationText} • {timeText}
          </Text>

          {/* Seller display name with green check icon if verified and rating if > 0 */}
          {seller && (
            <View
              style={[
                styles.sellerRow,
                { borderTopColor: isDark ? colors.border : '#F0ECE1' },
              ]}
            >
              <Text
                style={[
                  styles.sellerName,
                  { color: isDark ? colors.textSecondary : '#5B6660' },
                ]}
                numberOfLines={1}
              >
                {seller.displayName}
              </Text>
              {seller.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color="#0E9F6E"
                  style={styles.verifiedIcon}
                />
              )}
              {seller.averageRating > 0 && (
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingText}>
                    ⭐ {toBanglaDigits(seller.averageRating.toFixed(1))}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
});

/**
 * Skeleton shimmer placeholder for loading states
 */
export function ListingCardSkeleton({
  variant = 'grid',
}: {
  variant?: 'grid' | 'list';
}) {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 650 }),
        withTiming(0.35, { duration: 650 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bgPlaceholder = isDark ? '#263830' : '#E7E3DA';

  if (variant === 'list') {
    return (
      <View
        style={[
          styles.listContainer,
          styles.listPressable,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E7E3DA',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.listThumbnail,
            { backgroundColor: bgPlaceholder },
            animatedStyle,
          ]}
        />
        <View style={styles.listDetails}>
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: '45%', height: 18, backgroundColor: bgPlaceholder },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: '90%', height: 14, backgroundColor: bgPlaceholder },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: '60%', height: 12, backgroundColor: bgPlaceholder },
              animatedStyle,
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridPressable}>
      <View
        style={[
          styles.gridContainer,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E7E3DA',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.gridImageWrapper,
            { backgroundColor: bgPlaceholder },
            animatedStyle,
          ]}
        />
        <View style={styles.gridContent}>
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: '50%', height: 16, backgroundColor: bgPlaceholder },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: '90%', height: 14, backgroundColor: bgPlaceholder },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonLine,
              { width: '70%', height: 12, backgroundColor: bgPlaceholder },
              animatedStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Grid Card Styles
  gridPressable: {
    flex: 1,
    margin: 6,
  },
  gridContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#1B2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  gridImageWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    backgroundColor: '#E7E3DA',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECE1',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  conditionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(27,36,32,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FontFamilies.medium,
  },
  soldOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(27,36,32,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridContent: {
    padding: 10,
    gap: 3,
  },
  priceText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
  },
  titleText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamilies.medium,
    minHeight: 36,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamilies.regular,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  sellerName: {
    fontSize: 11,
    fontFamily: FontFamilies.regular,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 1,
  },
  ratingBox: {
    marginLeft: 'auto',
  },
  ratingText: {
    fontSize: 10,
    color: '#5B6660',
    fontFamily: FontFamilies.regular,
  },

  // List Card Styles
  listPressable: {
    marginVertical: 6,
    marginHorizontal: 12,
  },
  listContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
    shadowColor: '#1B2420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listImageWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E7E3DA',
  },
  listThumbnail: {
    width: 110,
    height: 110,
  },
  listDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FontFamilies.medium,
  },
  skeletonLine: {
    borderRadius: 4,
    marginVertical: 4,
  },
});

export default ListingCard;
