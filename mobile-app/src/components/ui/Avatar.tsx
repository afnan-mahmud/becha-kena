import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { FontFamilies } from '@/constants/theme';

// The backend has no profile photo — every avatar is an initial letter on a colour
// derived from the name, so the same person always gets the same colour.
const AVATAR_COLORS = [
  '#00704A', '#0E7490', '#7C3AED', '#C2410C', '#BE123C',
  '#15803D', '#1D4ED8', '#A16207', '#9D174D', '#0F766E',
];

export function getAvatarColor(name?: string | null): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** First visible character (works for Bangla grapheme starts and emoji-free names) */
export function getInitial(name?: string | null): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  return Array.from(trimmed)[0].toUpperCase();
}

export interface AvatarProps {
  name?: string | null;
  size?: number;
  verified?: boolean;
  style?: ViewStyle;
  /** Optional ring colour (e.g. white on coloured headers) */
  borderColor?: string;
}

export const Avatar = React.memo(function Avatar({
  name,
  size = 44,
  verified = false,
  style,
  borderColor,
}: AvatarProps) {
  const badgeSize = Math.max(14, Math.round(size * 0.32));
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getAvatarColor(name),
          borderWidth: borderColor ? 2 : 0,
          borderColor,
        },
        style,
      ]}
      accessibilityLabel={name ?? undefined}
    >
      <AppText
        style={{
          color: '#FFFFFF',
          fontSize: size * 0.42,
          lineHeight: size * 0.56,
          fontFamily: FontFamilies.bold,
          fontWeight: '700',
        }}
      >
        {getInitial(name)}
      </AppText>
      {verified ? (
        <View
          style={[
            styles.badge,
            { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 },
          ]}
        >
          <Ionicons name="checkmark" size={badgeSize * 0.7} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#0E9F6E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;
