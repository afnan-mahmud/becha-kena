import { Platform, TextStyle, ViewStyle, useColorScheme } from 'react-native';
import { useUiStore } from '@/store/ui.store';

/**
 * Becha-Kena Design System Tokens
 * Inspired by Bangladeshi culture: Flag Green (#00704A) + Flag Red (#E63946) + Marigold (#F4B400)
 * On a warm kantha off-white background (#F7F5F0)
 */

export const Colors = {
  light: {
    primary: '#00704A',
    primaryDark: '#00563A',
    primaryDarker: '#003D29',
    primarySoft: '#E3F3EC',

    accent: '#E63946',
    accentSoft: '#FDECEE',

    secondary: '#F4B400',
    secondarySoft: '#FFF5D6',

    success: '#16A34A',
    successSoft: '#E7F7ED',
    warning: '#D97706',
    warningSoft: '#FEF3E2',
    error: '#DC2626',
    errorSoft: '#FDECEC',
    info: '#2563EB',
    infoSoft: '#E8EFFE',
    verified: '#0E9F6E',

    background: '#F7F5F0',
    backgroundSubtle: '#FBFAF7',
    surface: '#FFFFFF',

    text: '#1B2420',
    textSecondary: '#5B6660',
    textMuted: '#8F9892',

    border: '#E7E3DA',
    borderDark: '#D5D0C4',

    // Chat bubbles
    chatMine: '#00704A',
    chatMineText: '#FFFFFF',
    chatTheirs: '#FFFFFF',
    chatTheirsText: '#1B2420',
    chatTheirsBorder: '#E7E3DA',
  },
  dark: {
    primary: '#00704A',
    primaryDark: '#00563A',
    primaryDarker: '#003D29',
    primarySoft: '#143828',

    accent: '#E63946',
    accentSoft: '#3A191C',

    secondary: '#F4B400',
    secondarySoft: '#3D3008',

    success: '#16A34A',
    successSoft: '#123820',
    warning: '#D97706',
    warningSoft: '#3A2808',
    error: '#DC2626',
    errorSoft: '#3A1414',
    info: '#2563EB',
    infoSoft: '#13284A',
    verified: '#0E9F6E',

    background: '#0F1A15',
    backgroundSubtle: '#13221C',
    surface: '#17241E',

    text: '#F0F4F2',
    textSecondary: '#A3ADA7',
    textMuted: '#6D7771',

    border: '#263830',
    borderDark: '#354D43',

    // Chat bubbles
    chatMine: '#00704A',
    chatMineText: '#FFFFFF',
    chatTheirs: '#17241E',
    chatTheirsText: '#F0F4F2',
    chatTheirsBorder: '#263830',
  },
} as const;

export type ThemeColors = typeof Colors.light;

/**
 * Spacing Scale
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  // Numeric aliases
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

/**
 * Corner Radius Scale
 */
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

/**
 * Shadows (iOS shadow* + Android elevation)
 */
export const Shadows = {
  sm: {
    ...Platform.select({
      ios: {
        shadowColor: '#1B2420',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#1B2420',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  } as ViewStyle,
  md: {
    ...Platform.select({
      ios: {
        shadowColor: '#1B2420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: '#1B2420',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    }),
  } as ViewStyle,
  lg: {
    ...Platform.select({
      ios: {
        shadowColor: '#1B2420',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: '#1B2420',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
    }),
  } as ViewStyle,
} as const;

/**
 * Font Family names for Hind Siliguri (Bangla-first)
 */
export const FontFamilies = {
  regular: 'HindSiliguri_400Regular',
  medium: 'HindSiliguri_500Medium',
  semiBold: 'HindSiliguri_600SemiBold',
  bold: 'HindSiliguri_700Bold',
} as const;

/**
 * Typography Scale
 */
export const Typography: Record<string, TextStyle> = {
  heading1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    fontFamily: FontFamilies.semiBold,
  },
  heading3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: FontFamilies.semiBold,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: FontFamilies.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: FontFamilies.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: FontFamilies.regular,
  },
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: FontFamilies.semiBold,
  },
  price: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    fontFamily: FontFamilies.bold,
  },
};

export type TypographyVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'price';

/**
 * Hook to access current theme colors and tokens
 */
export function useTheme() {
  const systemScheme = useColorScheme();
  // Subscribe so every screen re-renders when the user switches theme in Settings
  const themeMode = useUiStore((s) => s.themeMode);

  const resolvedScheme =
    themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  const colors = Colors[resolvedScheme];
  const isDark = resolvedScheme === 'dark';

  return {
    colors,
    isDark,
    themeMode,
    spacing: Spacing,
    radius: Radius,
    shadows: Shadows,
    typography: Typography,
  };
}
