import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: 'বিজ্ঞাপন বিবরণ' }} />
      <Stack.Screen name="listing/edit/[id]" options={{ headerShown: true, title: 'বিজ্ঞাপন সম্পাদন' }} />
      <Stack.Screen name="my-listings" options={{ headerShown: true, title: 'আমার বিজ্ঞাপন' }} />
      <Stack.Screen name="chat/[roomId]" options={{ headerShown: true, title: 'বার্তা' }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'ব্যবহারকারীর প্রোফাইল' }} />
      <Stack.Screen name="kyc/index" options={{ headerShown: true, title: 'এনআইডি যাচাইকরণ' }} />
      <Stack.Screen name="kyc/adult" options={{ headerShown: true, title: 'প্রাপ্তবয়স্ক এনআইডি' }} />
      <Stack.Screen name="kyc/minor" options={{ headerShown: true, title: 'জন্মনিবন্ধন যাচাইকরণ' }} />
      <Stack.Screen name="kyc/status" options={{ headerShown: true, title: 'যাচাইকরণ অবস্থা' }} />
      <Stack.Screen name="settings/index" options={{ headerShown: true, title: 'সেটিংস' }} />
      <Stack.Screen name="settings/edit-profile" options={{ headerShown: true, title: 'প্রোফাইল পরিবর্তন' }} />
      <Stack.Screen name="settings/notifications" options={{ headerShown: true, title: 'বিজ্ঞপ্তি' }} />
      <Stack.Screen name="settings/my-reports" options={{ headerShown: true, title: 'আমার রিপোর্ট' }} />
      <Stack.Screen name="settings/about" options={{ headerShown: true, title: 'অ্যাপ সম্পর্কে' }} />
    </Stack>
  );
}
