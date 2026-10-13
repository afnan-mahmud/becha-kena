import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { kycService } from '@/services/kyc.service';

// ─── Trust chip data ───────────────────────────────────────────────────────────

const TRUST_CHIPS = [
  { emoji: '🔒', label: 'তথ্য এনক্রিপ্টেড' },
  { emoji: '⏱', label: 'মাত্র ২ মিনিট' },
  { emoji: '✅', label: 'একবার যাচাই, সবসময় ভেরিফাইড' },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function KycLandingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isChecking, setIsChecking] = useState(true);

  /**
   * Guard on focus:
   * 1. Already verified → replace to home tabs.
   * 2. Pending review → replace to /kyc/status.
   * 3. Otherwise render this screen.
   */
  useEffect(() => {
    let cancelled = false;

    const runGuard = async () => {
      // Guard 1: already verified
      if (user?.isVerified) {
        router.replace('/(app)/(tabs)/home');
        return;
      }

      // Guard 2: check server status for pending_review
      try {
        const log = await kycService.getStatus();
        if (!cancelled && log?.verificationStatus === 'pending_review') {
          router.replace('/(app)/kyc/status');
          return;
        }
      } catch {
        // Network error — fall through and show the landing
      }

      if (!cancelled) {
        setIsChecking(false);
      }
    };

    runGuard();
    return () => {
      cancelled = true;
    };
  }, [user?.isVerified]);

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00704A" />
      </View>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.heroSection}>
        <View style={styles.shieldIconContainer}>
          <Text style={styles.shieldIcon}>🛡️</Text>
        </View>
        <Text style={styles.heroTitle}>আপনার পরিচয় যাচাই করুন</Text>
        <Text style={styles.heroSubtitle}>
          বিজ্ঞাপন দিতে, চ্যাট করতে ও বিক্রেতার নম্বর দেখতে একবার NID দিয়ে
          যাচাই করুন।
        </Text>
      </View>

      {/* ── Trust chips ── */}
      <View style={styles.chipsRow}>
        {TRUST_CHIPS.map((chip) => (
          <View key={chip.label} style={styles.chip}>
            <Text style={styles.chipEmoji}>{chip.emoji}</Text>
            <Text style={styles.chipLabel}>{chip.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Cards ── */}
      <View style={styles.cardsContainer}>
        {/* Adult card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/kyc/adult')}
        >
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIcon}>🪪</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>আমার বয়স ১৮+</Text>
            <Text style={styles.cardDescription}>
              নিজের NID নম্বর ও সেলফি দিয়ে যাচাই করুন
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>অথবা</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Minor card */}
        <TouchableOpacity
          style={[styles.card, styles.cardMinor]}
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/kyc/minor')}
        >
          <View style={[styles.cardIconCircle, styles.cardIconCircleMinor]}>
            <Text style={styles.cardIcon}>👨‍👧</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>আমার বয়স ১৮-এর কম</Text>
            <Text style={styles.cardDescription}>
              অভিভাবকের NID ও সম্মতির মাধ্যমে যাচাই করুন
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Privacy note ── */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyIcon}>🔐</Text>
        <Text style={styles.privacyText}>
          আপনার NID নম্বর আমরা সরাসরি সংরক্ষণ করি না — শুধু এনক্রিপ্টেড
          হ্যাশ রাখা হয়।
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  shieldIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F3EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00704A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shieldIcon: {
    fontSize: 38,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B2420',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#5B6660',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 4,
  },

  // Trust chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1B2420',
  },

  // Cards
  cardsContainer: {
    gap: 0,
    marginBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#00704A',
    shadowColor: '#00704A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMinor: {
    borderColor: '#2B6CB0',
    shadowColor: '#2B6CB0',
  },
  cardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E3F3EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconCircleMinor: {
    backgroundColor: '#EBF4FF',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2420',
  },
  cardDescription: {
    fontSize: 13,
    color: '#5B6660',
    lineHeight: 19,
  },
  cardArrow: {
    fontSize: 24,
    color: '#B0B8B4',
    fontWeight: '300',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 4,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E3DA',
  },
  dividerText: {
    fontSize: 13,
    color: '#9AA4A0',
    fontWeight: '500',
  },

  // Privacy note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F6D860',
  },
  privacyIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
});
