import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'পাওয়া যায়নি' }} />
      <View style={styles.container}>
        <Text style={styles.title}>এই পৃষ্ঠাটি বিদ্যমান নেই।</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>হোমে ফিরে যান</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F5F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B2420',
    marginBottom: 16,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#00704A',
    borderRadius: 8,
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
