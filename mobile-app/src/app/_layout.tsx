import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold,
} from '@expo-google-fonts/hind-siliguri';
import { useAuthStore } from '@/store/auth.store';

// Prevent splash screen from auto-hiding until bootstrap & fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Global QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold,
  });

  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  // Bootstrap auth state once on mount
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

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
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
