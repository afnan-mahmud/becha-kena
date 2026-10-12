import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>ইউ</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>ব্যবহারকারী</Text>
          <Text style={styles.userPhone}>+880 1XXXXXXXXX</Text>
        </View>
      </View>

      <KYCStatusBanner showVerifiedBadge />

      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/my-listings')}
        >
          <Text style={styles.menuText}>আমার বিজ্ঞাপনসমূহ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/kyc')}
        >
          <Text style={styles.menuText}>এনআইডি / কেওয়াইসি যাচাই</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(app)/settings')}
        >
          <Text style={styles.menuText}>সেটিংস ও অ্যাকাউন্ট</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00704A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B2420',
  },
  userPhone: {
    fontSize: 14,
    color: '#5B6660',
    marginTop: 2,
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
