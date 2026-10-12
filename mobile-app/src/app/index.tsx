import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const hasOnboarded = useAuthStore((state) => state.hasOnboarded);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // During bootstrapping, return null so splash screen stays up
  if (isBootstrapping) {
    return null;
  }

  // Not onboarded -> redirect to welcome / onboarding
  if (!hasOnboarded) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Not authenticated -> redirect to phone login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated -> redirect to home tabs
  return <Redirect href="/(app)/(tabs)/home" />;
}
