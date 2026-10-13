import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme';
import { toBanglaDigits } from '@/lib/format';
import { AppText } from './AppText';

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export interface ImageCarouselProps {
  images: string[];
  height?: number;
  showCounter?: boolean;
  onImagePress?: (index: number) => void;
  /** Extra content drawn above the images (e.g. a "sold" overlay) */
  overlay?: React.ReactNode;
}

// ─── Dot indicator ───────────────────────────────────────────────────────────

function Dot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const position = scrollX.value / width;
    const distance = Math.abs(position - index);
    return {
      width: interpolate(distance, [0, 1], [18, 6], 'clamp'),
      opacity: interpolate(distance, [0, 1], [1, 0.5], 'clamp'),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// ─── Zoomable image for the full-screen viewer ───────────────────────────────

function ZoomableImage({
  uri,
  width,
  height,
  onZoomChange,
  onDismiss,
}: {
  uri: string;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
  onDismiss: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dismissY = useSharedValue(0);

  const setZoom = useCallback(
    (z: boolean) => {
      setZoomed(z);
      onZoomChange(z);
    },
    [onZoomChange]
  );

  const clampX = (s: number) => {
    'worklet';
    return ((s - 1) * width) / 2;
  };
  const clampY = (s: number) => {
    'worklet';
    return ((s - 1) * height) / 2;
  };

  const reset = () => {
    'worklet';
    scale.set(withSpring(1));
    tx.set(withSpring(0));
    ty.set(withSpring(0));
    scheduleOnRN(setZoom, false);
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.set(scale.value);
    })
    .onUpdate((e) => {
      scale.set(Math.min(4, Math.max(1, startScale.value * e.scale)));
    })
    .onEnd(() => {
      if (scale.value < 1.05) reset();
      else scheduleOnRN(setZoom, true);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        reset();
      } else {
        scale.set(withSpring(2.5));
        scheduleOnRN(setZoom, true);
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.set(tx.value);
      startY.set(ty.value);
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        const mx = clampX(scale.value);
        const my = clampY(scale.value);
        tx.set(Math.min(mx, Math.max(-mx, startX.value + e.translationX)));
        ty.set(Math.min(my, Math.max(-my, startY.value + e.translationY)));
      } else {
        dismissY.set(e.translationY);
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) return;
      if (Math.abs(dismissY.value) > 120 || Math.abs(e.velocityY) > 900) {
        scheduleOnRN(onDismiss);
      } else {
        dismissY.set(withSpring(0));
      }
    });

  // When not zoomed, only vertical drags belong to us — horizontal swipes page the list
  if (!zoomed) {
    pan.activeOffsetY([-12, 12]).failOffsetX([-12, 12]);
  }

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dismissY.value), [0, 300], [1, 0.4], 'clamp'),
    transform: [
      { translateX: tx.value },
      { translateY: ty.value + dismissY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, styles.center]}>
        <Animated.View style={[{ width, height }, imageStyle]}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" cachePolicy="memory-disk" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Full-screen viewer ──────────────────────────────────────────────────────

function FullScreenViewer({
  images,
  initialIndex,
  visible,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.viewer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          scrollEnabled={scrollEnabled}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, i) => `${uri}_${i}`}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => (
            <ZoomableImage
              uri={item}
              width={width}
              height={height}
              onZoomChange={(z) => setScrollEnabled(!z)}
              onDismiss={onClose}
            />
          )}
        />
        <View style={[styles.viewerTop, { top: insets.top + 8 }]}>
          <AppText style={styles.viewerCounter}>
            {toBanglaDigits(index + 1)}/{toBanglaDigits(images.length)}
          </AppText>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="বন্ধ করুন">
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ─── Carousel ────────────────────────────────────────────────────────────────

/**
 * Horizontal paging image carousel with animated dots, a "১/৫" counter and a
 * full-screen viewer (swipe, double-tap / pinch to zoom, swipe down to close).
 */
export function ImageCarousel({ images, height = 300, showCounter = true, onImagePress, overlay }: ImageCarouselProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const listRef = useRef<FlatList<string>>(null);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (!images.length) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: colors.primarySoft }]}>
        <Ionicons name="image-outline" size={48} color={colors.primary} />
        <AppText variant="bodySmall" color={colors.primary} style={styles.placeholderText}>
          কোনো ছবি নেই
        </AppText>
        {overlay}
      </View>
    );
  }

  return (
    <View style={{ height, backgroundColor: colors.backgroundSubtle }}>
      <Animated.FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${uri}_${i}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <Pressable
            onPress={() => (onImagePress ? onImagePress(i) : setViewerIndex(i))}
            accessibilityRole="imagebutton"
            accessibilityLabel={`ছবি ${i + 1}`}
          >
            <Image
              source={{ uri: item }}
              placeholder={{ blurhash: BLURHASH }}
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={item}
              contentFit="cover"
              style={{ width, height }}
            />
          </Pressable>
        )}
      />

      {overlay}

      {images.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {images.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>
      ) : null}

      {showCounter ? (
        <View style={styles.counter} pointerEvents="none">
          <AppText style={styles.counterText}>
            {toBanglaDigits(index + 1)}/{toBanglaDigits(images.length)}
          </AppText>
        </View>
      ) : null}

      {viewerIndex !== null ? (
        <FullScreenViewer
          images={images}
          initialIndex={viewerIndex}
          visible
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </View>
  );
}

/** Imperative helper so other screens can open the viewer without a carousel */
export { FullScreenViewer };

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: 8 },
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dot: { height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  counterText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, fontWeight: '600' },
  viewer: { flex: 1, backgroundColor: '#000000' },
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewerTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerCounter: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageCarousel;
