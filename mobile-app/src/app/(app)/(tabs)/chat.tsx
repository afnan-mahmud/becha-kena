import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { formatChatTime, toBanglaDigits } from '@/lib/format';
import { getOtherUser } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { KYCStatusBanner } from '@/components/kyc/KYCStatusBanner';
import { TypingDots } from '@/components/chat/TypingIndicator';
import { AppText, Avatar, Button, EmptyState, SkeletonChatRow } from '@/components/ui';
import type { ChatRoom } from '@/types/chat.types';

const ChatRow = React.memo(function ChatRow({
  room,
  myId,
  typing,
  index,
}: {
  room: ChatRoom;
  myId?: string;
  typing: boolean;
  index: number;
}) {
  const { colors } = useTheme();
  const other = getOtherUser(room, myId);
  const iAmSeller = room.sellerId === myId;
  const unread = room.unreadCount > 0;
  const last = room.lastMessage;
  const preview = last ? `${last.senderId === myId ? 'আপনি: ' : ''}${last.messageText}` : 'এখনো কোনো মেসেজ নেই';

  return (
    <Animated.View entering={index < 10 ? FadeInDown.delay(index * 30).duration(250) : undefined}>
      <Pressable
        onPress={() => router.push(`/(app)/chat/${room.id}`)}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.backgroundSubtle }]}
        accessibilityRole="button"
        accessibilityLabel={`${other?.displayName ?? ''}, ${room.listing?.title ?? ''}${unread ? `, ${room.unreadCount}টি নতুন মেসেজ` : ''}`}
      >
        <View>
          <Avatar name={other?.displayName} size={52} />
          {room.listing?.images?.[0] ? (
            <Image
              source={{ uri: room.listing.images[0] }}
              style={[styles.listingThumb, { borderColor: colors.surface }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={room.listing.images[0]}
            />
          ) : null}
        </View>

        <View style={styles.middle}>
          <View style={styles.nameRow}>
            <AppText variant="body" numberOfLines={1} style={[styles.name, unread && styles.bold]}>
              {other?.displayName ?? 'ব্যবহারকারী'}
            </AppText>
            {other?.isVerified ? <Ionicons name="checkmark-circle" size={15} color={colors.verified} /> : null}
          </View>
          <View style={styles.listingRow}>
            <View style={[styles.roleTag, { backgroundColor: iAmSeller ? colors.infoSoft : colors.primarySoft }]}>
              <AppText style={[styles.roleText, { color: iAmSeller ? colors.info : colors.primary }]}>
                {iAmSeller ? 'ক্রেতা' : 'বিক্রেতা'}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.flex}>
              {room.listing?.title ?? 'বিজ্ঞাপন মুছে ফেলা হয়েছে'}
            </AppText>
          </View>
          {typing ? (
            <View style={styles.typingRow}>
              <AppText variant="bodySmall" color={colors.primary} style={styles.bold}>
                টাইপ করছে
              </AppText>
              <TypingDots color={colors.primary} />
            </View>
          ) : (
            <AppText
              variant="bodySmall"
              numberOfLines={1}
              color={unread ? colors.text : colors.textMuted}
              style={unread ? styles.bold : undefined}
            >
              {preview}
            </AppText>
          )}
        </View>

        <View style={styles.right}>
          <AppText variant="caption" color={unread ? colors.accent : colors.textMuted} style={unread ? styles.bold : undefined}>
            {formatChatTime(room.latestActivity)}
          </AppText>
          {unread ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <AppText style={styles.badgeText}>{room.unreadCount > 99 ? '৯৯+' : toBanglaDigits(room.unreadCount)}</AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
});

/** Chats tab (Prompt 29) */
export default function ChatListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const rooms = useChatStore((s) => s.rooms);
  const roomsLoaded = useChatStore((s) => s.roomsLoaded);
  const roomsLoading = useChatStore((s) => s.roomsLoading);
  const roomsError = useChatStore((s) => s.roomsError);
  const typingByRoom = useChatStore((s) => s.typingByRoom);
  const isConnected = useChatStore((s) => s.isConnected);
  const fetchRooms = useChatStore((s) => s.fetchRooms);
  const [query, setQuery] = useState('');

  const isVerified = me?.isVerified ?? false;

  useFocusEffect(
    useCallback(() => {
      if (isVerified) fetchRooms();
    }, [isVerified, fetchRooms])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const other = getOtherUser(r, me?.id);
      return (
        other?.displayName?.toLowerCase().includes(q) || r.listing?.title?.toLowerCase().includes(q)
      );
    });
  }, [rooms, query, me?.id]);

  const renderItem = useCallback(
    ({ item, index }: { item: ChatRoom; index: number }) => (
      <ChatRow room={item} myId={me?.id} typing={!!typingByRoom[item.id]} index={index} />
    ),
    [me?.id, typingByRoom]
  );

  // Guard: chat is for verified users only
  if (!isVerified) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
        <View style={styles.guard}>
          <EmptyState
            icon="chatbubbles-outline"
            title="চ্যাট করতে যাচাই করুন"
            subtitle="প্রতারণা ঠেকাতে শুধু NID-যাচাইকৃত ব্যবহারকারীরা একে অপরের সাথে চ্যাট করতে পারেন।"
          />
          <KYCStatusBanner />
          <Button title="এখনই যাচাই করুন" onPress={() => router.push('/(app)/kyc')} fullWidth style={styles.guardBtn} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppText variant="heading2">মেসেজ</AppText>
        <View style={styles.connection}>
          <View style={[styles.dot, { backgroundColor: isConnected ? colors.success : colors.textMuted }]} />
          {!isConnected ? (
            <AppText variant="caption" color={colors.textMuted}>
              সংযোগ হচ্ছে…
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="নাম বা বিজ্ঞাপন খুঁজুন"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        refreshControl={
          <RefreshControl
            refreshing={roomsLoading && roomsLoaded}
            onRefresh={fetchRooms}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !roomsLoaded && roomsLoading ? (
            <View>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonChatRow key={i} />
              ))}
            </View>
          ) : roomsError && !rooms.length ? (
            <EmptyState variant="error" subtitle={roomsError} onAction={fetchRooms} />
          ) : query ? (
            <EmptyState variant="noResults" title="কিছু পাওয়া যায়নি" subtitle="অন্য নাম বা শব্দ দিয়ে খুঁজুন" />
          ) : (
            <EmptyState
              variant="noChats"
              subtitle="এখনো কোনো চ্যাট নেই। কোনো বিজ্ঞাপন থেকে বিক্রেতার সাথে চ্যাট শুরু করুন।"
              actionLabel="বিজ্ঞাপন দেখুন"
              onAction={() => router.navigate('/(app)/(tabs)/home')}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  bold: { fontFamily: FontFamilies.semiBold, fontWeight: '600' },
  guard: { padding: 24 },
  guardBtn: { marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: FontFamilies.regular, fontSize: 15, paddingVertical: 0 },
  list: { flexGrow: 1, paddingBottom: 24 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 80 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  listingThumb: { position: 'absolute', right: -4, bottom: -4, width: 24, height: 24, borderRadius: 6, borderWidth: 2 },
  middle: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1, fontWeight: '500' },
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleTag: { paddingHorizontal: 6, borderRadius: 4 },
  roleText: { fontSize: 10, lineHeight: 15, fontWeight: '700' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  right: { alignItems: 'flex-end', gap: 6, minWidth: 54 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontWeight: '700' },
});
