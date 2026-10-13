import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { FontFamilies, useTheme } from '@/constants/theme';
import { useSocket } from '@/hooks/useSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPermissionSheet } from '@/components/common/NotificationPermissionSheet';
import { DisclaimerModal } from '@/components/common/DisclaimerModal';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { colors } = useTheme();

  // One socket connection + notification wiring for the whole logged-in session
  useSocket();
  const { showPrePermission, requestPermission, dismissPrePermission } = useNotifications();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: FontFamilies.semiBold, fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        {/* Custom headers (image carousel / chat header / profile cover) */}
        <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[roomId]" options={{ headerShown: false }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="listing/edit/[id]" options={{ headerShown: true, title: 'বিজ্ঞাপন এডিট' }} />
        <Stack.Screen name="my-listings" options={{ headerShown: true, title: 'আমার বিজ্ঞাপন' }} />
        <Stack.Screen name="kyc/index" options={{ headerShown: true, title: 'পরিচয় যাচাই' }} />
        <Stack.Screen name="kyc/adult" options={{ headerShown: true, title: 'NID যাচাই (১৮+)' }} />
        <Stack.Screen name="kyc/minor" options={{ headerShown: true, title: 'অভিভাবকের NID যাচাই' }} />
        <Stack.Screen name="kyc/status" options={{ headerShown: true, title: 'যাচাইয়ের অবস্থা' }} />
        <Stack.Screen name="settings/index" options={{ headerShown: true, title: 'সেটিংস' }} />
        <Stack.Screen name="settings/edit-profile" options={{ headerShown: true, title: 'প্রোফাইল এডিট' }} />
        <Stack.Screen name="settings/notifications" options={{ headerShown: true, title: 'নোটিফিকেশন' }} />
        <Stack.Screen name="settings/my-reports" options={{ headerShown: true, title: 'আমার রিপোর্ট' }} />
        <Stack.Screen name="settings/about" options={{ headerShown: true, title: 'বেচা-কেনা সম্পর্কে' }} />
        <Stack.Screen
          name="settings/delete-account"
          options={{ headerShown: true, title: 'অ্যাকাউন্ট মুছুন', presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>

      <NotificationPermissionSheet
        visible={showPrePermission}
        onAllow={requestPermission}
        onLater={dismissPrePermission}
      />
      <DisclaimerModal />
    </>
  );
}
