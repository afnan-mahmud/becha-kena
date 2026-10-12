import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ChatListScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>চ্যাট তালিকা</Text>
      <Text style={styles.subtitle}>ক্রেতা এবং বিক্রেতাদের সাথে বার্তা আদান-প্রদান</Text>

      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => router.push('/(app)/chat/demo-room-123')}
      >
        <Text style={styles.roomTitle}>ডেমো চ্যাট রুম খুলুন</Text>
        <Text style={styles.roomSubtitle}>ট্যাপ করে চ্যাট কথোপকথন দেখুন</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B2420',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#5B6660',
    marginBottom: 20,
  },
  roomItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    gap: 4,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00704A',
  },
  roomSubtitle: {
    fontSize: 13,
    color: '#5B6660',
  },
});
