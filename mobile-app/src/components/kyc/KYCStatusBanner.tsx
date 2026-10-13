import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { kycService, VerificationLog, VerificationStatus } from '@/services/kyc.service';

// ─── Cache ────────────────────────────────────────────────────────────────────
// Simple module-level cache so multiple banner instances don't hammer the API.
const STALE_MS = 60_000;

let cachedLog: VerificationLog | null = null;
let cacheTimestamp = 0;

async function fetchWithCache(): Promise<VerificationLog | null> {
  const now = Date.now();
  if (cachedLog !== null && now - cacheTimestamp < STALE_MS) {
    return cachedLog;
  }
  const result = await kycService.getStatus();
  cachedLog = result;
  cacheTimestamp = now;
  return result;
}

/** Call this to invalidate the cache (e.g. after KYC submission). */
export function invalidateKycStatusCache() {
  cachedLog = null;
  cacheTimestamp = 0;
}

// ─── Banner config ────────────────────────────────────────────────────────────

interface BannerConfig {
  bg: string;
  border: string;
  icon: string;
  text: string;
  href: '/(app)/kyc' | '/(app)/kyc/status';
}

function getBannerConfig(status: VerificationStatus | 'none'): BannerConfig | null {
  switch (status) {
    case 'none':
      return {
        bg: '#FFFBEB',
        border: '#F6D860',
        icon: '⚠️',
        text: 'আপনার অ্যাকাউন্ট যাচাই হয়নি। এখনই যাচাই করুন →',
        href: '/(app)/kyc',
      };
    case 'pending_review':
      return {
        bg: '#EBF8FF',
        border: '#90CDF4',
        icon: '⏳',
        text: 'যাচাই চলছে, ফলাফল শীঘ্রই জানানো হবে →',
        href: '/(app)/kyc/status',
      };
    case 'rejected':
      return {
        bg: '#FFF5F5',
        border: '#FED7D7',
        icon: '❌',
        text: 'যাচাই বাতিল হয়েছে, আবার চেষ্টা করুন →',
        href: '/(app)/kyc',
      };
    default:
      return null;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface KYCStatusBannerProps {
  /** When true, show a small "✅ ভেরিফাইড" badge instead of nothing for verified users. */
  showVerifiedBadge?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KYCStatusBanner({ showVerifiedBadge = false }: KYCStatusBannerProps) {
  const router = useRouter();
  const isVerified = useAuthStore((state) => state.user?.isVerified ?? false);

  const [logStatus, setLogStatus] = useState<VerificationStatus | 'none' | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Already verified — no need to fetch
    if (isVerified) {
      setLogStatus('approved');
      return;
    }

    fetchWithCache()
      .then((log) => {
        if (!mountedRef.current) return;
        setLogStatus(log?.verificationStatus ?? 'none');
      })
      .catch(() => {
        if (mountedRef.current) setLogStatus('none');
      });

    return () => {
      mountedRef.current = false;
    };
  }, [isVerified]);

  // Still loading
  if (logStatus === null) return null;

  // Verified
  if (isVerified || logStatus === 'approved') {
    if (!showVerifiedBadge) return null;
    return (
      <View style={b.verifiedBadge}>
        <Text style={b.verifiedText}>✅ ভেরিফাইড</Text>
      </View>
    );
  }

  const config = getBannerConfig(logStatus);
  if (!config) return null;

  return (
    <TouchableOpacity
      style={[b.banner, { backgroundColor: config.bg, borderColor: config.border }]}
      onPress={() => router.push(config.href)}
      activeOpacity={0.8}
    >
      <Text style={b.bannerIcon}>{config.icon}</Text>
      <Text style={b.bannerText}>{config.text}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const b = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerIcon: { fontSize: 16 },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1B2420',
    lineHeight: 19,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F3EC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#00704A',
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#00704A' },
});
