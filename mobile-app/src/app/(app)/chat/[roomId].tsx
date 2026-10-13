import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Radius, useTheme } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { joinRoom, leaveRoom, sendMessage, sendTyping } from '@/lib/socket';
import { getOtherUser } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput, MAX_MESSAGE_LENGTH } from '@/components/chat/ChatInput';
import { DateSeparator } from '@/components/chat/DateSeparator';
import { ListingHeader } from '@/components/chat/ListingHeader';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ReviewModal, useHasReviewed } from '@/components/listing/ReviewModal';
import { AppText, Avatar, EmptyState } from '@/components/ui';
import type { Message } from '@/types/chat.types';

type Item = { type: 'message'; message: Message } | { type: 'separator'; key: string; date: string };

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// The server replaces these anyway — warn before sending (links / BD phone numbers)
const LINK_RE = /(https?:\/\/|www\.)\S+|\b\S+\.(com|net|org|xyz|bd|io|me)\b/i;
const PHONE_RE = /(\+?88)?\s*0?1[3-9](\s*-?\s*\d){8}/;
const toAscii = (t: string) => t.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));

/** Conversation screen (Prompt 30) */
export default function ConversationScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);

  const room = useChatStore((s) => s.rooms.find((r) => r.id === roomId));
  const roomsLoaded = useChatStore((s) => s.roomsLoaded);
  const messages = useChatStore((s) => s.messagesByRoom[roomId]);
  const hasMore = useChatStore((s) => s.hasMoreByRoom[roomId]);
  const loading = useChatStore((s) => s.loadingByRoom[roomId]);
  const typing = useChatStore((s) => s.typingByRoom[roomId]);
  const isConnected = useChatStore((s) => s.isConnected);

  const [text, setText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [safetyDismissed, setSafetyDismissed] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewed, setReviewedLocally] = useHasReviewed(room?.listing?.id);
  const [openedAt] = useState(() => Date.now());

  // ─── Lifecycle: active room, history, socket room ──────────────────────────
  useEffect(() => {
    const store = useChatStore.getState();
    store.setActiveRoom(roomId);
    if (!store.rooms.some((r) => r.id === roomId)) store.fetchRooms(); // deep link / notification tap
    store
      .fetchMessages(roomId)
      .then(() => useChatStore.getState().markRoomRead(roomId)) // page 1 already marked them read on the server
      .catch((err) => setLoadError(getErrorMessage(err)));
    return () => {
      leaveRoom(roomId);
      useChatStore.getState().setActiveRoom(null);
    };
  }, [roomId]);

  // (Re)join the socket room whenever we are connected — a new socket forgets joined rooms
  useEffect(() => {
    if (isConnected) joinRoom(roomId);
  }, [isConnected, roomId]);

  // A message from the other person arrived while this screen is open → mark it read
  const lastMessage = messages?.[messages.length - 1];
  useEffect(() => {
    if (lastMessage && lastMessage.senderId !== me?.id && !lastMessage.readStatus) {
      useChatStore.getState().markRoomRead(roomId);
    }
  }, [lastMessage, me?.id, roomId]);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const other = room ? getOtherUser(room, me?.id) : null;
  const iAmSeller = room?.sellerId === me?.id;
  const listing = room?.listing ?? null;
  const showReviewPrompt =
    !!room && !iAmSeller && listing?.status === 'sold' && listing.soldToBuyerId === me?.id && reviewed === false;

  // Inverted list: newest first, with a date separator above each day's first message
  const items: Item[] = useMemo(() => {
    if (!messages) return [];
    const reversed = [...messages].reverse();
    const out: Item[] = [];
    reversed.forEach((m, i) => {
      out.push({ type: 'message', message: m });
      const older = reversed[i + 1];
      if (!older || dayKey(older.createdAt) !== dayKey(m.createdAt)) {
        out.push({ type: 'separator', key: `sep_${dayKey(m.createdAt)}`, date: m.createdAt });
      }
    });
    return out;
  }, [messages]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) =>
      item.type === 'separator' ? (
        <DateSeparator date={item.date} />
      ) : (
        <ChatBubble
          message={item.message}
          isMine={item.message.senderId === me?.id}
          animate={new Date(item.message.createdAt).getTime() > openedAt}
        />
      ),
    [me?.id, openedAt]
  );

  // ─── Sending ───────────────────────────────────────────────────────────────
  const doSend = async (body: string) => {
    setText(''); // clear right away; the echo / ack adds the bubble
    try {
      const { message, warnings } = await sendMessage(roomId, body);
      useChatStore.getState().addMessage(message); // de-duplicated with the 'new_message' echo
      if (warnings?.length) toast.warning('মেসেজ সম্পর্কে সতর্কতা', { body: warnings.join('\n') });
    } catch (err) {
      setText((current) => current || body); // restore so nothing is lost
      toast.error('মেসেজ পাঠানো যায়নি', { body: getErrorMessage(err) });
    }
  };

  const handleSend = (raw: string) => {
    const body = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!body) return;
    const ascii = toAscii(body);
    if (LINK_RE.test(ascii) || PHONE_RE.test(ascii)) {
      Alert.alert(
        'লিংক / ফোন নম্বর',
        'নিরাপত্তার জন্য মেসেজের লিংক ও ফোন নম্বর মুছে দেওয়া হবে। তবুও পাঠাবেন?',
        [
          { text: 'বাতিল', style: 'cancel' },
          { text: 'পাঠান', onPress: () => doSend(body) },
        ]
      );
      return;
    }
    doSend(body);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn} accessibilityLabel="ফিরে যান">
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Pressable
        style={styles.headerUser}
        onPress={() => other && router.push(`/(app)/user/${other.id}`)}
        disabled={!other}
        accessibilityRole="button"
      >
        <Avatar name={other?.displayName} size={40} verified={other?.isVerified} />
        <View style={styles.flex}>
          <AppText variant="body" numberOfLines={1} style={styles.bold}>
            {other?.displayName ?? (roomsLoaded ? 'ব্যবহারকারী' : '…')}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {room ? (iAmSeller ? 'ক্রেতা' : 'বিক্রেতা') : ''}
            {other?.isVerified ? ' • NID ভেরিফাইড' : ''}
          </AppText>
        </View>
      </Pressable>
      {!isConnected ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {header}
      {room ? <ListingHeader listing={listing} /> : null}

      {/* Banners */}
      {!safetyDismissed ? (
        <Animated.View exiting={FadeOut} style={[styles.banner, { backgroundColor: colors.warningSoft }]}>
          <AppText variant="caption" style={styles.flex}>
            ⚠️ জনবহুল জায়গায় দেখা করুন। পণ্য না দেখে অগ্রিম টাকা পাঠাবেন না।
          </AppText>
          <Pressable onPress={() => setSafetyDismissed(true)} hitSlop={10} accessibilityLabel="বন্ধ করুন">
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>
      ) : null}
      {showReviewPrompt ? (
        <Animated.View entering={FadeIn} style={[styles.banner, { backgroundColor: colors.secondarySoft }]}>
          <Ionicons name="star" size={16} color={colors.secondary} />
          <AppText variant="caption" style={[styles.flex, styles.bold]}>
            আপনি পণ্যটি কিনেছেন! বিক্রেতাকে রিভিউ দিন
          </AppText>
          <Pressable onPress={() => setReviewOpen(true)} style={[styles.reviewBtn, { backgroundColor: colors.primary }]}>
            <AppText variant="caption" style={styles.reviewBtnText}>
              রিভিউ দিন
            </AppText>
          </Pressable>
        </Animated.View>
      ) : null}
      {listing && listing.status !== 'active' ? (
        <View style={[styles.inactiveNote, { backgroundColor: colors.backgroundSubtle }]}>
          <AppText variant="caption" color={colors.textMuted} align="center">
            বিজ্ঞাপনটি আর সক্রিয় নেই
          </AppText>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loadError && !messages ? (
          <EmptyState
            variant="error"
            subtitle={loadError}
            onAction={() => {
              setLoadError(null);
              useChatStore.getState().fetchMessages(roomId).catch((err) => setLoadError(getErrorMessage(err)));
            }}
          />
        ) : !messages ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <FlatList
            data={items}
            inverted
            keyExtractor={(item) => (item.type === 'message' ? item.message.id : item.key)}
            renderItem={renderItem}
            contentContainerStyle={styles.messages}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onEndReached={() => hasMore && useChatStore.getState().fetchOlder(roomId)}
            onEndReachedThreshold={0.3}
            maxToRenderPerBatch={15}
            windowSize={9}
            ListHeaderComponent={typing ? <TypingIndicator /> : null}
            ListFooterComponent={loading && messages.length ? <ActivityIndicator style={styles.olderLoader} color={colors.primary} /> : null}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <AppText variant="bodySmall" color={colors.textMuted} align="center">
                  👋 কথোপকথন শুরু করুন — পণ্যটি এখনো আছে কিনা জিজ্ঞেস করুন।
                </AppText>
              </View>
            }
          />
        )}

        <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.surface }}>
          <ChatInput
            value={text}
            onChangeText={setText}
            onSend={handleSend}
            onTyping={() => sendTyping(roomId)}
            placeholder={isConnected ? 'মেসেজ লিখুন…' : 'সংযোগ হচ্ছে…'}
          />
        </View>
      </KeyboardAvoidingView>

      {listing && other ? (
        <ReviewModal
          visible={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onReviewed={setReviewedLocally}
          target={{
            listingId: listing.id,
            title: listing.title,
            image: listing.images?.[0],
            price: listing.price,
            sellerId: room!.sellerId,
            sellerName: other.displayName,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  reviewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm },
  reviewBtnText: { color: '#FFFFFF', fontWeight: '700' },
  inactiveNote: { paddingVertical: 4 },
  loader: { flex: 1 },
  olderLoader: { marginVertical: 12 },
  messages: { paddingVertical: 8, flexGrow: 1 },
  emptyChat: { flex: 1, justifyContent: 'center', padding: 32, transform: [{ scaleY: -1 }] },
});
