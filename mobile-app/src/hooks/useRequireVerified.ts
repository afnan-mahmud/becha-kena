import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

/**
 * Hook to guard actions that require NID verification.
 * Returns a guard(actionName) function that:
 * - returns true if user.isVerified
 * - otherwise shows an alert "এই কাজের জন্য NID দিয়ে যাচাই প্রয়োজন" and navigates to /(app)/kyc, returning false.
 */
export const useRequireVerified = () => {
  const user = useAuthStore((state) => state.user);

  const guard = (actionName?: string): boolean => {
    if (user?.isVerified) {
      return true;
    }

    Alert.alert(
      'যাচাইকরণ প্রয়োজন',
      'এই কাজের জন্য NID দিয়ে যাচাই প্রয়োজন',
      [
        {
          text: 'বাতিল',
          style: 'cancel',
        },
        {
          text: 'যাচাই করুন',
          onPress: () => {
            router.push('/(app)/kyc');
          },
        },
      ]
    );

    return false;
  };

  return guard;
};

export default useRequireVerified;
