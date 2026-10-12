import { View, Text, StyleSheet } from 'react-native';

export default function KycAdultScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>প্রাপ্তবয়স্ক এনআইডি ভেরিফিকেশন</Text>
      <Text style={styles.subtitle}>এনআইডি কার্ডের সামনের ও পেছনের ছবি এবং লাইভ সেলফি আপলোড করুন</Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>প্রাপ্তবয়স্ক কেওয়াইসি ফর্ম (Prompt 9)</Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B2420',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderCard: {
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
    textAlign: 'center',
  },
});
