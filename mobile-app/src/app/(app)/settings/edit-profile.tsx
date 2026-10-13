import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Radius, useTheme } from '@/constants/theme';
import { maskPhone } from '@/lib/format';
import { sanitizeDisplayName, stripHtml } from '@/lib/validators';
import { getErrorDetails, getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth.store';
import { AppText, Avatar, Button, Input, Screen } from '@/components/ui';

/** Edit display name (Prompt 33). No avatar upload — the backend has no avatar field. */
export default function EditProfileScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.displayName ?? '');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const trimmed = name.trim();
  const changed = trimmed !== user.displayName;

  const validate = (value: string) => {
    const t = value.trim();
    if (!t) return 'নাম খালি রাখা যাবে না';
    if (t.length > 30) return 'নাম সর্বোচ্চ ৩০ অক্ষরের হতে পারবে';
    if (stripHtml(t) !== t) return 'নামে HTML ট্যাগ ব্যবহার করা যাবে না';
    return undefined;
  };

  const save = async () => {
    const v = validate(name);
    setError(v);
    if (v) return;
    setSaving(true);
    try {
      const updated = await userService.updateMe({ displayName: sanitizeDisplayName(name) });
      setUser(updated);
      toast.success('প্রোফাইল আপডেট হয়েছে');
      router.back();
    } catch (err) {
      setError(getErrorDetails(err) ?? getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <Avatar name={trimmed || user.displayName} size={88} verified={user.isVerified} />
        <AppText variant="caption" color={colors.textMuted} style={styles.avatarHint}>
          প্রোফাইল ছবি আপনার নামের প্রথম অক্ষর দিয়ে তৈরি হয়
        </AppText>
      </View>

      <Input
        label="ডিসপ্লে নাম"
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (error) setError(validate(t));
        }}
        maxLength={30}
        characterCounter
        autoCapitalize="words"
        error={error}
        hint="এটি আপনার ডাকনাম। আইনগত নাম (NID অনুযায়ী) পরিবর্তন করা যায় না।"
      />

      <View style={[styles.readonly, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}>
        <Ionicons name="call-outline" size={18} color={colors.textMuted} />
        <View style={styles.flex}>
          <AppText variant="caption" color={colors.textMuted}>
            মোবাইল নম্বর
          </AppText>
          <AppText variant="body">{maskPhone(user.phoneNumber)}</AppText>
        </View>
        <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
      </View>

      {user.isVerified && user.verifiedName ? (
        <View style={[styles.readonly, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.verified} />
          <View style={styles.flex}>
            <AppText variant="caption" color={colors.textMuted}>
              আইনগত নাম (NID অনুযায়ী)
            </AppText>
            <AppText variant="body">{user.verifiedName}</AppText>
          </View>
          <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
        </View>
      ) : null}

      <Button title="সংরক্ষণ করুন" onPress={save} loading={saving} disabled={!changed} fullWidth size="lg" style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16 },
  avatarWrap: { alignItems: 'center', marginVertical: 16 },
  avatarHint: { marginTop: 8 },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  save: { marginTop: 12 },
});
