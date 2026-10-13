import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { kycService, VerificationLog } from '@/services/kyc.service';
import { useAuthStore } from '@/store/auth.store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBanglaDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const TYPE_LABEL: Record<string, string> = {
  adult: 'প্রাপ্তবয়স্ক (NID)',
  minor: 'অপ্রাপ্তবয়স্ক (অভিভাবক NID)',
};

// ─── Sub-views ────────────────────────────────────────────────────────────────

function EmptyState({ onApply }: { onApply: () => void }) {
  return (
    <View style={st.centeredCard}>
      <Text style={st.bigIcon}>📋</Text>
      <Text style={st.stateTitle}>কোনো আবেদন নেই</Text>
      <Text style={st.stateSubtitle}>
        আপনি এখনো পরিচয় যাচাইয়ের জন্য আবেদন করেননি।
      </Text>
      <TouchableOpacity style={st.primaryBtn} onPress={onApply} activeOpacity={0.85}>
        <Text style={st.primaryBtnText}>এখনই যাচাই করুন →</Text>
      </TouchableOpacity>
    </View>
  );
}

function PendingState({ log }: { log: VerificationLog }) {
  return (
    <View style={st.centeredCard}>
      <Text style={st.bigIcon}>⏳</Text>
      <Text style={[st.stateTitle, { color: '#2B6CB0' }]}>রিভিউ চলছে…</Text>
      <Text style={st.stateSubtitle}>
        সাধারণত ১২ ঘণ্টার মধ্যে ফলাফল জানানো হয়
      </Text>
      <View style={st.infoCard}>
        <InfoRow label="আবেদনের ধরন" value={TYPE_LABEL[log.verificationType] ?? log.verificationType} />
        <View style={st.infoDivider} />
        <InfoRow label="জমা দেওয়ার তারিখ" value={formatBanglaDate(log.createdAt)} />
      </View>
      <View style={st.pendingBadge}>
        <Text style={st.pendingBadgeText}>🔵 পর্যালোচনাধীন</Text>
      </View>
    </View>
  );
}

function ApprovedState() {
  const router = useRouter();
  return (
    <View style={st.centeredCard}>
      <Text style={[st.bigIcon, { fontSize: 56 }]}>🎉</Text>
      <Text style={[st.stateTitle, { color: '#00704A' }]}>
        অভিনন্দন! আপনি এখন ভেরিফাইড
      </Text>
      <Text style={st.stateSubtitle}>
        এখন থেকে বিজ্ঞাপন দিতে, চ্যাট করতে ও বিক্রেতার নম্বর দেখতে পারবেন।
      </Text>
      <TouchableOpacity
        style={st.primaryBtn}
        onPress={() => router.replace('/(app)/(tabs)/home')}
        activeOpacity={0.85}
      >
        <Text style={st.primaryBtnText}>প্রথম বিজ্ঞাপন দিন →</Text>
      </TouchableOpacity>
    </View>
  );
}

function RejectedState({
  log,
  onReapply,
}: {
  log: VerificationLog;
  onReapply: () => void;
}) {
  return (
    <View style={st.centeredCard}>
      <Text style={st.bigIcon}>❌</Text>
      <Text style={[st.stateTitle, { color: '#C53030' }]}>যাচাই বাতিল হয়েছে</Text>
      {log.manualReviewReason ? (
        <View style={st.rejectionBox}>
          <Text style={st.rejectionLabel}>কারণ:</Text>
          <Text style={st.rejectionReason}>{log.manualReviewReason}</Text>
        </View>
      ) : null}
      <Text style={st.stateSubtitle}>
        তথ্য সংশোধন করে আবার আবেদন করুন।
      </Text>
      <TouchableOpacity style={st.dangerBtn} onPress={onReapply} activeOpacity={0.85}>
        <Text style={st.dangerBtnText}>আবার আবেদন করুন →</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.infoRow}>
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={st.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000;

export default function KycStatusScreen() {
  const router = useRouter();
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [log, setLog] = useState<VerificationLog | null | undefined>(undefined); // undefined = loading
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const result = await kycService.getStatus();
      setLog(result);

      // When it transitions to approved → sync auth store
      if (result?.verificationStatus === 'approved') {
        await refreshUser();
        stopPolling();
      }
    } catch {
      // Silently ignore — keep showing last known state
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [refreshUser]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      fetchStatus();
    }, POLL_INTERVAL_MS);
  }, [fetchStatus]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Initial fetch + poll on focus
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
      startPolling();
      return () => stopPolling();
    }, [fetchStatus, startPolling])
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (log === undefined) {
    return (
      <View style={st.loadingContainer}>
        <ActivityIndicator size="large" color="#00704A" />
      </View>
    );
  }

  const status = log?.verificationStatus ?? null;

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={st.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchStatus(true)}
          tintColor="#00704A"
          colors={['#00704A']}
        />
      }
    >
      {/* Header */}
      <View style={st.header}>
        <Text style={st.headerTitle}>যাচাইকরণ অবস্থা</Text>
        <Text style={st.headerSub}>নিচে টেনে রিফ্রেশ করুন</Text>
      </View>

      {/* State views */}
      {status === null && (
        <EmptyState onApply={() => router.replace('/(app)/kyc')} />
      )}
      {status === 'pending_review' && log && (
        <PendingState log={log} />
      )}
      {status === 'approved' && (
        <ApprovedState />
      )}
      {status === 'rejected' && log && (
        <RejectedState
          log={log}
          onReapply={() => router.replace('/(app)/kyc')}
        />
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { padding: 20, paddingBottom: 48, gap: 16 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: { alignItems: 'center', paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1B2420' },
  headerSub: { fontSize: 12, color: '#8F9892', marginTop: 4 },

  // Shared card
  centeredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bigIcon: { fontSize: 48 },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B2420',
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#5B6660',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Info card (pending)
  infoCard: {
    width: '100%',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoDivider: { height: 1, backgroundColor: '#BEE3F8', marginHorizontal: 16 },
  infoLabel: { fontSize: 13, color: '#5B6660', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#1B2420', fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  // Pending badge
  pendingBadge: {
    backgroundColor: '#EBF8FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#90CDF4',
  },
  pendingBadgeText: { fontSize: 13, color: '#2B6CB0', fontWeight: '600' },

  // Rejection
  rejectionBox: {
    width: '100%',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7D7',
    gap: 4,
  },
  rejectionLabel: { fontSize: 12, color: '#C53030', fontWeight: '700', textTransform: 'uppercase' },
  rejectionReason: { fontSize: 14, color: '#742A2A', lineHeight: 21 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#00704A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dangerBtn: {
    backgroundColor: '#C53030',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
  },
  dangerBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
