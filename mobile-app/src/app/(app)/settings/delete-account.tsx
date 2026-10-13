import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { FontFamilies, Radius, useTheme } from '@/constants/theme';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { AppText, Button, Screen } from '@/components/ui';

const CONFIRM_WORD = 'DELETE';

const CONSEQUENCES = [
  'আপনার সব সক্রিয় ও রিভিউতে থাকা বিজ্ঞাপন সাথে সাথে আর্কাইভ হবে',
  'সব ডিভাইস থেকে লগআউট হয়ে যাবে',
  '৩০ দিন পর আপনার ব্যক্তিগত তথ্য স্থায়ীভাবে মুছে যাবে',
  '৩০ দিনের মধ্যে আবার লগইন করলে মুছে ফেলার অনুরোধ বাতিল হয়ে যাবে',
];

/**
 * Account deletion (Prompt 42). DELETE /users/me revokes ALL tokens, so we
 * clear everything locally afterwards instead of calling /auth/logout.
 */
export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const localLogout = useAuthStore((s) => s.localLogout);
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = typed.trim().toUpperCase() === CONFIRM_WORD;

  const deleteAccount = async () => {
    if (!matches) return;
    setDeleting(true);
    setError(null);
    try {
      await userService.deleteMe();
      await localLogout('/(auth)/welcome');
      toast.success('অ্যাকাউন্ট মুছে ফেলার অনুরোধ নেওয়া হয়েছে', {
        body: '৩০ দিনের মধ্যে আবার লগইন করলে অ্যাকাউন্ট ফিরে পাবেন।',
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <Screen scroll edges={['left', 'right', 'bottom']} contentContainerStyle={styles.content}>
      <View style={[styles.icon, { backgroundColor: colors.errorSoft }]}>
        <Ionicons name="warning" size={40} color={colors.error} />
      </View>
      <AppText variant="heading2" align="center">
        আপনি কি সত্যিই অ্যাকাউন্ট মুছে ফেলতে চান?
      </AppText>

      {step === 1 ? (
        <Animated.View entering={FadeInRight} style={styles.block}>
          <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {CONSEQUENCES.map((c) => (
              <View key={c} style={styles.item}>
                <Ionicons name="ellipse" size={8} color={colors.error} style={styles.bullet} />
                <AppText variant="body" style={styles.flex}>
                  {c}
                </AppText>
              </View>
            ))}
          </View>
          <Button title="চালিয়ে যান" variant="danger" onPress={() => setStep(2)} fullWidth size="lg" />
          <Button title="বাতিল" variant="ghost" onPress={() => router.back()} fullWidth />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInRight} style={styles.block}>
          <AppText variant="body" color={colors.textSecondary} align="center">
            নিশ্চিত করতে নিচে বড় হাতের অক্ষরে <AppText style={styles.bold}>{CONFIRM_WORD}</AppText> লিখুন
          </AppText>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            placeholder={CONFIRM_WORD}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.text, borderColor: matches ? colors.error : colors.border, backgroundColor: colors.surface },
            ]}
            accessibilityLabel="নিশ্চিতকরণ শব্দ"
          />
          {error ? (
            <AppText variant="bodySmall" color={colors.error} align="center">
              {error}
            </AppText>
          ) : null}
          <Button
            title="অ্যাকাউন্ট মুছুন"
            variant="danger"
            onPress={deleteAccount}
            disabled={!matches}
            loading={deleting}
            fullWidth
            size="lg"
          />
          <Button title="পেছনে" variant="ghost" onPress={() => setStep(1)} fullWidth disabled={deleting} />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  content: { padding: 20, alignItems: 'stretch' },
  icon: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  block: { marginTop: 20, gap: 12 },
  list: { borderRadius: Radius.lg, borderWidth: 1, padding: 16, gap: 12, marginBottom: 8 },
  item: { flexDirection: 'row', gap: 10 },
  bullet: { marginTop: 9 },
  input: {
    borderWidth: 2,
    borderRadius: Radius.md,
    height: 52,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 4,
    fontFamily: FontFamilies.bold,
  },
});
