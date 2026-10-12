import { View, Text, StyleSheet } from 'react-native';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>অনুসন্ধান</Text>
      <Text style={styles.subtitle}>ফিল্টার ও কীওয়ার্ড দিয়ে পণ্য খুঁজুন</Text>
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>অনুসন্ধান স্ক্রিন (Prompt 16)</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B2420',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#5B6660',
    marginBottom: 24,
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
