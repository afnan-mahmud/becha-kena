import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function KycLandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>এনআইডি / কেওয়াইসি যাচাই</Text>
      <Text style={styles.subtitle}>নিরাপদ লেনদেনের জন্য আপনার পরিচয় যাচাই সম্পন্ন করুন</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(app)/kyc/adult')}
        >
          <Text style={styles.optionTitle}>প্রাপ্তবয়স্ক (১৮+ বছর)</Text>
          <Text style={styles.optionDescription}>জাতীয় পরিচয়পত্র (NID) ও সেলফি দিয়ে যাচাই করুন</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(app)/kyc/minor')}
        >
          <Text style={styles.optionTitle}>অপ্রাপ্তবয়স্ক (১৮ বছরের কম)</Text>
          <Text style={styles.optionDescription}>জন্মনিবন্ধন সনদ ও অভিভাবকের এনআইডি দিয়ে যাচাই করুন</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, styles.statusCard]}
          onPress={() => router.push('/(app)/kyc/status')}
        >
          <Text style={styles.statusTitle}>বর্তমান ভেরিফিকেশন স্ট্যাটাস দেখুন</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00704A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    gap: 6,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B2420',
  },
  optionDescription: {
    fontSize: 14,
    color: '#5B6660',
  },
  statusCard: {
    backgroundColor: '#E3F3EC',
    borderColor: '#00704A',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00704A',
  },
});
