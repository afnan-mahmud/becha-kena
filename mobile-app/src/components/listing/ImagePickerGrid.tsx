import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Radius, useTheme } from '@/constants/theme';
import { uploadImage } from '@/services/media.service';
import { useImagePicker } from '@/hooks/useImagePicker';
import { getErrorMessage } from '@/lib/errors';
import { toBanglaDigits } from '@/lib/format';
import { AppText } from '@/components/ui';

export interface UploadItem {
  key: string;
  /** local file (preview) — absent for images that were already on the server */
  localUri?: string;
  /** public S3 URL once uploaded */
  remoteUrl?: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

type Updater = (prev: UploadItem[]) => UploadItem[];

export interface ImagePickerGridProps {
  value: UploadItem[];
  /** Pass a React state setter — updates arrive asynchronously while uploading */
  onChange: (updater: Updater) => void;
  max?: number;
}

/** Existing image URLs (edit screen) count as already uploaded */
export const toUploadItems = (urls: string[]): UploadItem[] =>
  urls.map((url, i) => ({ key: `remote_${i}_${url}`, remoteUrl: url, status: 'done' }));

export const getUploadedUrls = (items: UploadItem[]) =>
  items.filter((i) => i.status === 'done' && i.remoteUrl).map((i) => i.remoteUrl as string);

export const isAnyUploading = (items: UploadItem[]) => items.some((i) => i.status === 'uploading');

let keySeq = 0;

/**
 * Photo grid for the ad form (Prompt 20): "+" opens camera / gallery, uploads
 * start immediately, first tile is the cover, long-press another to make it cover.
 */
export function ImagePickerGrid({ value, onChange, max = 10 }: ImagePickerGridProps) {
  const { colors } = useTheme();
  const { takePhoto, pickFromLibrary } = useImagePicker();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const startUpload = useCallback(
    async (key: string, localUri: string) => {
      try {
        const url = await uploadImage(localUri, 'listings');
        if (!mounted.current) return;
        onChange((prev) => prev.map((i) => (i.key === key ? { ...i, status: 'done', remoteUrl: url, error: undefined } : i)));
      } catch (err) {
        if (!mounted.current) return;
        onChange((prev) =>
          prev.map((i) => (i.key === key ? { ...i, status: 'error', error: getErrorMessage(err, 'আপলোড ব্যর্থ') } : i))
        );
      }
    },
    [onChange]
  );

  const addUris = (uris: string[]) => {
    if (!uris.length) return;
    const room = max - value.length;
    const items: UploadItem[] = uris.slice(0, room).map((uri) => ({
      key: `local_${Date.now()}_${keySeq++}`,
      localUri: uri,
      status: 'uploading',
    }));
    onChange((prev) => [...prev, ...items].slice(0, max));
    items.forEach((item) => startUpload(item.key, item.localUri!));
  };

  const openPicker = () => {
    const remaining = max - value.length;
    if (remaining <= 0) return;
    Alert.alert('ছবি যোগ করুন', `আরও ${toBanglaDigits(remaining)}টি ছবি যোগ করা যাবে`, [
      { text: 'ছবি তুলুন', onPress: async () => addUris(await takePhoto()) },
      { text: 'গ্যালারি থেকে', onPress: async () => addUris(await pickFromLibrary(remaining)) },
      { text: 'বাতিল', style: 'cancel' },
    ]);
  };

  const remove = (key: string) => onChange((prev) => prev.filter((i) => i.key !== key));

  const retry = (item: UploadItem) => {
    if (!item.localUri) return;
    onChange((prev) => prev.map((i) => (i.key === item.key ? { ...i, status: 'uploading', error: undefined } : i)));
    startUpload(item.key, item.localUri);
  };

  const makeCover = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onChange((prev) => {
      const item = prev.find((i) => i.key === key);
      return item ? [item, ...prev.filter((i) => i.key !== key)] : prev;
    });
  };

  return (
    <View style={styles.grid}>
      {value.map((item, index) => (
        <Animated.View
          key={item.key}
          entering={FadeIn}
          exiting={FadeOut}
          layout={LinearTransition}
          style={[styles.tile, { borderColor: index === 0 ? colors.primary : colors.border }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onLongPress={() => index > 0 && makeCover(item.key)}
            delayLongPress={350}
            accessibilityHint={index > 0 ? 'কভার বানাতে চেপে ধরুন' : undefined}
          >
            <Image
              source={{ uri: item.localUri ?? item.remoteUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          </Pressable>

          {item.status === 'uploading' ? (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}

          {item.status === 'error' ? (
            <Pressable style={[styles.overlay, styles.errorOverlay]} onPress={() => retry(item)}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <AppText variant="caption" style={styles.overlayText}>
                আবার চেষ্টা
              </AppText>
            </Pressable>
          ) : null}

          {index === 0 ? (
            <View style={[styles.coverTag, { backgroundColor: colors.primary }]} pointerEvents="none">
              <AppText variant="caption" style={styles.overlayText}>
                কভার
              </AppText>
            </View>
          ) : null}

          <Pressable onPress={() => remove(item.key)} style={styles.removeBtn} hitSlop={8} accessibilityLabel="ছবি সরান">
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      ))}

      {value.length < max ? (
        <Pressable
          onPress={openPicker}
          style={[styles.tile, styles.addTile, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
          accessibilityRole="button"
          accessibilityLabel="ছবি যোগ করুন"
        >
          <Ionicons name="camera-outline" size={26} color={colors.primary} />
          <AppText variant="caption" color={colors.primary} style={styles.addText}>
            {toBanglaDigits(value.length)}/{toBanglaDigits(max)}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  addTile: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  addText: { marginTop: 4, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorOverlay: { backgroundColor: 'rgba(220,38,38,0.65)' },
  overlayText: { color: '#FFFFFF', fontWeight: '700' },
  coverTag: { position: 'absolute', left: 6, bottom: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImagePickerGrid;
