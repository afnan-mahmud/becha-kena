import { View, Text, StyleSheet } from 'react-native';

export default function EditProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>প্রোফাইল সম্পাদন</Text>
      <Text style={styles.subtitle}>নাম, ছবি এবং ঠিকানা পরিবর্তন করুন</Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>প্রোফাইল সম্পাদন ফর্ম (Prompt 33)</Text>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#5B6660',
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
