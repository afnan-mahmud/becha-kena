import { View, Text, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>বেচা-কেনা</Text>
      <Text style={styles.version}>সংস্করণ ১.০.০</Text>
      <Text style={styles.description}>
        বাংলাদেশের সবচেয়ে নিরাপদ ও বিশ্বস্ত সেকেন্ড-হ্যান্ড মার্কেটপ্লেস।
        প্রত্যেক বিক্রেতা জাতীয় পরিচয়পত্র (NID) যাচাইকৃত।
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00704A',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#8F9892',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#5B6660',
    textAlign: 'center',
    lineHeight: 22,
  },
});
