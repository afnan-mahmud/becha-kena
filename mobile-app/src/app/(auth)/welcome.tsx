import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, AppText, Button } from '@/components/ui';
import { useTheme, Spacing, Radius, Shadows, FontFamilies } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

interface SlideItem {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  circleBg: string;
  ringColor: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  badgeIconColor: string;
  badgeText: string;
  title: string;
  tagline: string;
  description: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    iconName: 'storefront',
    iconColor: '#00704A',
    circleBg: '#E3F3EC',
    ringColor: '#CBEBDD',
    badgeIcon: 'sparkles',
    badgeIconColor: '#F4B400',
    badgeText: 'বিশ্বস্ত প্ল্যাটফর্ম',
    title: 'বেচা-কেনা',
    tagline: 'পুরনো জিনিস, নতুন ঠিকানা',
    description: 'বাংলাদেশের NID-যাচাইকৃত বিশ্বস্ত সেকেন্ড-হ্যান্ড মার্কেটপ্লেস',
  },
  {
    id: 'slide-2',
    iconName: 'shield-checkmark',
    iconColor: '#0E9F6E',
    circleBg: '#E7F7ED',
    ringColor: '#C4EED3',
    badgeIcon: 'checkmark-circle',
    badgeIconColor: '#00704A',
    badgeText: '১০০% এনআইডি যাচাইকৃত',
    title: '১০০% ভেরিফাইড ইউজার',
    tagline: 'নিরাপদ লেনদেন ও বিশ্বস্ততা',
    description: 'প্রত্যেক বিক্রেতা জাতীয় পরিচয়পত্র দিয়ে সতর্কভাবে যাচাইকৃত',
  },
  {
    id: 'slide-3',
    iconName: 'chatbubbles',
    iconColor: '#E63946',
    circleBg: '#FDECEE',
    ringColor: '#FAD1D6',
    badgeIcon: 'lock-closed',
    badgeIconColor: '#00704A',
    badgeText: 'প্রাইভেসি সুরক্ষিত',
    title: 'নিরাপদ চ্যাট, সহজ ডিল',
    tagline: 'নম্বর গোপন রেখে সরাসরি ডিল',
    description: 'নম্বর না দিয়েই চ্যাট করুন, সামনাসামনি দেখে কিনুন',
  },
];

interface SlideProps {
  item: SlideItem;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}

function OnboardingSlideItem({ item, index, scrollX, width }: SlideProps) {
  const { colors } = useTheme();

  const illustrationAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Parallax effect of the illustration
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-48, 0, 48],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.82, 1, 0.82],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 0.7) * width, index * width, (index + 0.7) * width];

    // Fade and translate of the text
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [28, 0, 28],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.slideContainer, { width }]}>
      {/* Parallax Illustration Circle */}
      <Animated.View style={[styles.illustrationWrapper, illustrationAnimatedStyle]}>
        <View style={[styles.outerRing, { borderColor: item.ringColor }]}>
          <View style={[styles.iconCircle, { backgroundColor: item.circleBg }]}>
            <Ionicons name={item.iconName} size={76} color={item.iconColor} />

            {/* Subtle floating badge */}
            <View style={[styles.floatingBadge, Shadows.sm]}>
              <Ionicons
                name={item.badgeIcon}
                size={14}
                color={item.badgeIconColor}
                style={styles.badgeIconStyle}
              />
              <AppText variant="caption" weight="600" color={colors.text}>
                {item.badgeText}
              </AppText>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Fade/Translate Text Content */}
      <Animated.View style={[styles.textContent, textAnimatedStyle]}>
        <AppText
          variant="heading1"
          align="center"
          color={colors.primary}
          style={styles.title}
        >
          {item.title}
        </AppText>

        <AppText
          variant="heading3"
          align="center"
          color={colors.text}
          style={styles.tagline}
        >
          {item.tagline}
        </AppText>

        <AppText
          variant="body"
          align="center"
          color={colors.textSecondary}
          style={styles.description}
        >
          {item.description}
        </AppText>
      </Animated.View>
    </View>
  );
}

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  activeColor: string;
}

function PaginationDot({ index, scrollX, width, activeColor }: DotProps) {
  const dotAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Smooth indicator width interpolation (widens when active)
    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 28, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      width: dotWidth,
      opacity,
      backgroundColor: activeColor,
    };
  });

  return <Animated.View style={[styles.dot, dotAnimatedStyle]} />;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleFinish = async () => {
    await setOnboarded(true);
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Top Header with Skip Button */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.brandBadge}>
          <View style={styles.flagGreenDot}>
            <View style={styles.flagRedDot} />
          </View>
          <AppText variant="caption" weight="700" color={colors.primary}>
            BECHA-KENA
          </AppText>
        </View>

        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.skipButton}
        >
          <AppText
            variant="bodySmall"
            weight="600"
            color={colors.textSecondary}
          >
            স্কিপ
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
            style={styles.skipIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Swipeable Slides */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef as any}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <OnboardingSlideItem
              item={item}
              index={index}
              scrollX={scrollX}
              width={width}
            />
          )}
        />
      </View>

      {/* Footer Area: Animated Indicator + Action Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
        {/* Animated Dot Indicators */}
        <View style={styles.paginationRow}>
          {SLIDES.map((slide, idx) => (
            <PaginationDot
              key={slide.id}
              index={idx}
              scrollX={scrollX}
              width={width}
              activeColor={colors.primary}
            />
          ))}
        </View>

        {/* Action Button: "পরবর্তী" or "শুরু করুন" on last slide */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          title={isLastSlide ? 'শুরু করুন' : 'পরবর্তী'}
          onPress={handleNext}
          rightIcon={
            <Ionicons
              name={isLastSlide ? 'arrow-forward-circle' : 'arrow-forward'}
              size={20}
              color="#FFFFFF"
            />
          }
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E7E3DA',
  },
  flagGreenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00704A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E63946',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipIcon: {
    marginLeft: 2,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['3xl'],
  },
  outerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  iconCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E7E3DA',
  },
  badgeIconStyle: {
    marginRight: 6,
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    marginBottom: Spacing.xs,
    fontFamily: FontFamilies.bold,
  },
  tagline: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: Spacing.md,
    fontFamily: FontFamilies.semiBold,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FontFamilies.regular,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    height: 12,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    borderRadius: Radius.lg,
  },
});
