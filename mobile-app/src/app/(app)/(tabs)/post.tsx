import { View, Text, StyleSheet } from 'react-native';
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner';
import { useAuthStore } from '@/store/auth.store';

export default function PostScreen() {
  const isVerified = useAuthStore((state) => state.user?.isVerified ?? false);

  // Show KYC guard if user is not verified
  if (!isVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.guardIcon}>🛡️</Text>
        <Text style={styles.title}>বিজ্ঞাপন দিতে যাচাই করুন</Text>
        <Text style={styles.subtitle}>
          বিজ্ঞাপন পোস্ট করতে আগে আপনার পরিচয় যাচাই সম্পন্ন করতে হবে।
        </Text>
        <KYCStatusBanner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>বিজ্ঞাপন পোস্ট করুন</Text>
      <Text style={styles.subtitle}>আপনার পণ্যের বিবরণ ও ছবি যুক্ত করুন</Text>
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>মাল্টি-স্টেপ বিজ্ঞাপন ফর্ম (Prompt 19)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F5F0',
    padding: 24,
    gap: 12,
  },
  guardIcon: { fontSize: 48, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B2420',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#5B6660',
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholderBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    width: '100%',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8F9892',
    fontSize: 14,
  },
});
