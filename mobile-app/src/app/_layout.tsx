import { useEffect } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { ErrorBoundaryProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { useFonts } from 'expo-font';
// Per-weight imports so only the 4 weights we use are bundled (Prompt 49)
import { HindSiliguri_400Regular } from '@expo-google-fonts/hind-siliguri/400Regular';
import { HindSiliguri_500Medium } from '@expo-google-fonts/hind-siliguri/500Medium';
import { HindSiliguri_600SemiBold } from '@expo-google-fonts/hind-siliguri/600SemiBold';
import { HindSiliguri_700Bold } from '@expo-google-fonts/hind-siliguri/700Bold';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/constants/theme';
import { NotificationBanner } from '@/components/common/NotificationBanner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { isOnline } from '@/hooks/useNetworkStatus';
import { queryClient } from '@/lib/queryClient';

// Prevent splash screen from auto-hiding until bootstrap & fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// TanStack Query pauses while offline and refetches on reconnect (Prompt 46)
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(isOnline(state)))
);

// …and treats "app came to the foreground" as window focus
function onAppStateChange(status: string) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold,
  });
  const { isDark } = useTheme();

  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  // Bootstrap auth state once on mount
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  // Keep splash screen until fonts are loaded and bootstrapping completes
  useEffect(() => {
    if ((fontsLoaded || fontError) && !isBootstrapping) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, isBootstrapping]);

  if ((!fontsLoaded && !fontError) || isBootstrapping) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
            <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'পাওয়া যায়নি' }} />
          </Stack>
          <OfflineBanner />
          <NotificationBanner />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

/**
 * Route-level error boundary (Prompt 46). Rendered by Expo Router when anything
 * below the root layout throws while rendering. Uses plain components because
 * the providers above may not be available here.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const dark = useColorScheme() === 'dark';
  return (
    <View style={[errorStyles.container, { backgroundColor: dark ? '#0F1A15' : '#F7F5F0' }]}>
      <Text style={errorStyles.emoji}>😕</Text>
      <Text style={[errorStyles.title, { color: dark ? '#F0F4F2' : '#1B2420' }]}>কিছু একটা সমস্যা হয়েছে</Text>
      <Text style={[errorStyles.subtitle, { color: dark ? '#A3ADA7' : '#5B6660' }]}>
        অ্যাপে একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।
      </Text>
      {__DEV__ ? (
        <Text style={errorStyles.devMessage} numberOfLines={6}>
          {error.message}
        </Text>
      ) : null}
      <Pressable style={errorStyles.button} onPress={retry} accessibilityRole="button">
        <Text style={errorStyles.buttonText}>আবার চেষ্টা করুন</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  devMessage: { fontSize: 12, color: '#DC2626', textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#00704A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
