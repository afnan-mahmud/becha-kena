import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import { formatChatTime } from '@/lib/format';
import { AppText } from '@/components/ui';
import type { Message } from '@/types/chat.types';

const MARIGOLD = '#F4B400';

export interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  /** Animate only messages that arrive while the screen is open */
  animate?: boolean;
}

/** One chat message (Prompt 31). Mine: right/green. Theirs: left/surface. */
export const ChatBubble = React.memo(function ChatBubble({ message, isMine, animate = false }: ChatBubbleProps) {
  const { colors } = useTheme();
  const entering = animate ? (isMine ? SlideInRight : SlideInLeft).springify().damping(18).stiffness(180) : undefined;

  return (
    <Animated.View
      entering={entering}
      style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}
    >
      <View
        style={[
          styles.bubble,
          isMine
            ? { backgroundColor: colors.chatMine, borderBottomRightRadius: 4 }
            : {
                backgroundColor: colors.chatTheirs,
                borderColor: colors.chatTheirsBorder,
                borderWidth: 1,
                borderBottomLeftRadius: 4,
              },
        ]}
      >
        <AppText
          variant="body"
          selectable
          style={[styles.text, { color: isMine ? colors.chatMineText : colors.chatTheirsText }]}
        >
          {message.messageText}
        </AppText>
        <View style={styles.meta}>
          <AppText style={[styles.time, { color: isMine ? colors.chatMineText : colors.textSecondary }]}>
            {formatChatTime(message.createdAt)}
          </AppText>
          {isMine ? (
            <Ionicons
              name={message.readStatus ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.readStatus ? MARIGOLD : 'rgba(255,255,255,0.75)'}
              accessibilityLabel={message.readStatus ? 'পড়া হয়েছে' : 'পাঠানো হয়েছে'}
            />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginVertical: 2, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  text: { fontSize: 15, lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { fontSize: 11, lineHeight: 14, opacity: 0.7 },
});

export default ChatBubble;
