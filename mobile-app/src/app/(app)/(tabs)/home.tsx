import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Button, Card, Badge, Chip } from '@/components/ui';
import { useTheme, Spacing } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('Mobile');

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Card variant="elevated" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <AppText variant="heading2" color={colors.primary}>
            বেচা-কেনা হোম
          </AppText>
          <Badge label="এনআইডি যাচাইকৃত" variant="green" />
        </View>
        <AppText variant="bodySmall" color={colors.textSecondary}>
          বাংলাদেশের বিশ্বস্ত সেকেন্ড-হ্যান্ড মার্কেটপ্লেসে স্বাগতম
        </AppText>
      </Card>

      <View style={styles.section}>
        <AppText variant="heading3" style={styles.sectionTitle}>
          ক্যাটাগরি সমূহ
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.slice(0, 6).map((cat) => (
            <Chip
              key={cat.value}
              label={`${cat.emoji} ${cat.label}`}
              selected={selectedCategory === cat.value}
              onPress={() => setSelectedCategory(cat.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <AppText variant="heading3" style={styles.sectionTitle}>
          বিজ্ঞাপন তালিকা
        </AppText>

        <Card variant="outlined" style={styles.itemCard}>
          <View style={styles.cardHeader}>
            <AppText variant="body" weight="600">
              iPhone 13 Pro 128GB
            </AppText>
            <Badge label="নতুন" variant="green" size="sm" />
          </View>
          <AppText variant="price" color={colors.primary}>
            ৳৬৫,০০০
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            ঢাকা • ধানমন্ডি
          </AppText>
          <Button
            variant="outline"
            size="sm"
            title="বিস্তারিত দেখুন"
            onPress={() => router.push('/(app)/listing/demo-123')}
            style={styles.cardButton}
          />
        </Card>

        <Card variant="outlined" style={styles.itemCard}>
          <View style={styles.cardHeader}>
            <AppText variant="body" weight="600">
              Honda CB Hornet 160R
            </AppText>
            <Badge label="ব্যবহৃত" variant="yellow" size="sm" />
          </View>
          <AppText variant="price" color={colors.primary}>
            ৳১,১৫,০০০
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            চট্টগ্রাম • পাঁচলাইশ
          </AppText>
          <Button
            variant="outline"
            size="sm"
            title="বিস্তারিত দেখুন"
            onPress={() => router.push('/(app)/listing/demo-456')}
            style={styles.cardButton}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          title="এনআইডি ভেরিফিকেশন শুরু করুন"
          onPress={() => router.push('/(app)/kyc')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  headerCard: {
    gap: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  itemCard: {
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
});
