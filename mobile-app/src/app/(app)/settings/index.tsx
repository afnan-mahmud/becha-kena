import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>সেটিংস</Text>
      <Text style={styles.subtitle}>অ্যাকাউন্ট এবং অ্যাপ্লিকেশন কনফিগারেশন</Text>

      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/settings/edit-profile')}
        >
          <Text style={styles.menuText}>প্রোফাইল পরিবর্তন</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/settings/notifications')}
        >
          <Text style={styles.menuText}>নোটিফিকেশন ও অ্যালার্ট</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/settings/my-reports')}
        >
          <Text style={styles.menuText}>আমার রিপোর্টসমূহ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/settings/about')}
        >
          <Text style={styles.menuText}>অ্যাপ সম্পর্কে</Text>
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
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E3DA',
  },
  menuText: {
    fontSize: 15,
    color: '#1B2420',
    fontWeight: '500',
  },
});
