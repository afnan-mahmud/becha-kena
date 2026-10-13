import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/constants/theme';
import { chatService } from '@/services/chat.service';
import { useMarkAsSold } from '@/hooks/useListings';
import { useAuthStore } from '@/store/auth.store';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { AppText, Avatar, BottomSheet, Button, EmptyState } from '@/components/ui';
import type { Listing } from '@/types/listing.types';

const OUTSIDE = '__outside__';

/**
 * "বিক্রি হয়েছে" flow (Prompt 22): pick the buyer from the people who chatted
 * about this ad (so they can review you), or "sold outside the app".
 */
export function MarkAsSoldSheet({
  listing,
  visible,
  onClose,
}: {
  listing: Listing | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const myId = useAuthStore((s) => s.user?.id);
  const [selected, setSelected] = useState<string | null>(null);
  const markAsSold = useMarkAsSold();

  const { data: rooms, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: chatService.getRooms,
    enabled: visible,
    staleTime: 15_000,
  });

  const buyers = useMemo(
    () => (rooms ?? []).filter((r) => r.listingId === listing?.id && r.sellerId === myId && r.buyer),
    [rooms, listing?.id, myId]
  );

  const close = () => {
    setSelected(null);
    onClose();
  };

  const confirm = async () => {
    if (!listing || !selected) return;
    const buyerId = selected === OUTSIDE ? undefined : selected;
    try {
      await markAsSold.mutateAsync({ id: listing.id, buyerId });
      toast.success(
        'বিক্রিত হিসেবে চিহ্নিত হয়েছে',
        buyerId ? { body: 'বিক্রিত! ক্রেতা এখন রিভিউ দিতে পারবেন' } : undefined
      );
      close();
    } catch (err) {
      if (getErrorCode(err) === 'NO_CHAT_HISTORY') {
        toast.error('এই ক্রেতার সাথে কোনো চ্যাট নেই', {
          body: 'শুধু যাঁরা এই বিজ্ঞাপন নিয়ে চ্যাট করেছেন তাঁদের ক্রেতা হিসেবে বাছা যায়।',
        });
      } else {
        toast.error('বিক্রিত করা যায়নি', { body: getErrorMessage(err) });
      }
    }
  };

  const option = (key: string, title: string, subtitle: string | undefined, avatarName?: string) => {
    const active = selected === key;
    return (
      <Pressable
        key={key}
        onPress={() => setSelected(key)}
        style={[
          styles.option,
          { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface },
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
      >
        {avatarName ? (
          <Avatar name={avatarName} size={40} />
        ) : (
          <View style={[styles.outsideIcon, { backgroundColor: colors.secondarySoft }]}>
            <Ionicons name="storefront-outline" size={20} color={colors.warning} />
          </View>
        )}
        <View style={styles.flex}>
          <AppText variant="body" style={styles.bold} numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.primary : colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title="কার কাছে বিক্রি করলেন?"
      snapPoints={[0.65, 0.9]}
      footer={
        <Button
          title="নিশ্চিত করুন"
          onPress={confirm}
          disabled={!selected}
          loading={markAsSold.isPending}
          fullWidth
          size="lg"
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.intro} numberOfLines={2}>
          "{listing?.title}" — ক্রেতা বেছে নিলে তিনি আপনাকে রিভিউ দিতে পারবেন।
        </AppText>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : isError ? (
          <EmptyState variant="error" compact onAction={() => refetch()} />
        ) : buyers.length === 0 ? (
          <AppText variant="bodySmall" color={colors.textMuted} style={styles.none}>
            এই বিজ্ঞাপন নিয়ে এখনো কেউ চ্যাট করেননি।
          </AppText>
        ) : (
          buyers.map((room) =>
            option(
              room.buyerId,
              room.buyer?.displayName ?? 'ক্রেতা',
              room.lastMessage?.messageText,
              room.buyer?.displayName
            )
          )
        )}

        {option(OUTSIDE, 'বেচা-কেনার বাইরে বিক্রি করেছি', 'কোনো ক্রেতা রিভিউ দিতে পারবেন না')}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  intro: { marginBottom: 4 },
  loader: { marginVertical: 24 },
  none: { paddingVertical: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5 },
  outsideIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

export default MarkAsSoldSheet;
