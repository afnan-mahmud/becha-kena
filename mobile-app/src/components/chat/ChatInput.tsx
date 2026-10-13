import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontFamilies, useTheme } from '@/constants/theme';
import { toBanglaDigits } from '@/lib/format';
import { AppText } from '@/components/ui';

export const MAX_MESSAGE_LENGTH = 1000;
const LINE_HEIGHT = 22;
const MAX_LINES = 4;

export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Auto-growing message input with counter + animated send button (Prompt 31) */
export function ChatInput({ value, onChangeText, onSend, onTyping, disabled = false, placeholder = 'মেসেজ লিখুন…' }: ChatInputProps) {
  const { colors } = useTheme();
  const [height, setHeight] = useState(LINE_HEIGHT);
  const scale = useSharedValue(1);
  const canSend = !disabled && value.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    scale.set(withSequence(withTiming(0.85, { duration: 80 }), withSpring(1, { damping: 10, stiffness: 260 })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSend(value);
  };

  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const length = value.length;
  const counterColor = length >= MAX_MESSAGE_LENGTH ? colors.error : length > 900 ? colors.warning : colors.textMuted;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            if (t.length) onTyping?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          editable={!disabled}
          onContentSizeChange={(e) => setHeight(e.nativeEvent.contentSize.height)}
          style={[
            styles.input,
            { color: colors.text, height: Math.min(Math.max(LINE_HEIGHT, height), LINE_HEIGHT * MAX_LINES + 8) },
          ]}
          accessibilityLabel="মেসেজ"
        />
        {length > 800 ? (
          <AppText style={[styles.counter, { color: counterColor }]}>
            {toBanglaDigits(length)}/{toBanglaDigits(MAX_MESSAGE_LENGTH)}
          </AppText>
        ) : null}
      </View>
      <Animated.View style={sendStyle}>
        <Pressable
          onPress={send}
          disabled={!canSend}
          style={[styles.sendBtn, { backgroundColor: canSend ? colors.primary : colors.borderDark }]}
          accessibilityRole="button"
          accessibilityLabel="পাঠান"
        >
          <Ionicons name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  input: { fontFamily: FontFamilies.regular, fontSize: 15, lineHeight: LINE_HEIGHT, padding: 0, textAlignVertical: 'top' },
  counter: { fontSize: 11, lineHeight: 14, alignSelf: 'flex-end' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { marginLeft: 2 },
});

export default ChatInput;
