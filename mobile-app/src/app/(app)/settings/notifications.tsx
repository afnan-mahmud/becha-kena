import React, { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Radius, useTheme } from '@/constants/theme';
import { toBanglaDigits } from '@/lib/format';
import { isInQuietHours, useNotificationPrefs } from '@/store/notificationPrefs.store';
import { AppText, Button, ListRow, ListSection } from '@/components/ui';

type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unknown';

const minutesToDate = (m: number) => {
  const d = new Date();
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
};

/** 23:00 → "১১:০০ PM" */
const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const h12 = h % 12 || 12;
  return `${toBanglaDigits(h12)}:${toBanglaDigits(String(min).padStart(2, '0'))} ${h >= 12 ? 'PM' : 'AM'}`;
};

/**
 * Notification preferences (Prompt 38) — stored on the device (the backend has
 * no preference API). Read by shouldNotify() in notificationPrefs.store.
 */
export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const prefs = useNotificationPrefs();
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [editing, setEditing] = useState<'start' | 'end' | null>(null);

  const loadPermission = useCallback(() => {
    Notifications.getPermissionsAsync()
      .then(({ status }) => setPermission(status as PermissionState))
      .catch(() => setPermission('unknown'));
  }, []);

  // Re-check after returning from the system settings
  useFocusEffect(loadPermission);

  const askPermission = async () => {
    if (permission === 'denied') {
      Linking.openSettings();
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    setPermission(status as PermissionState);
  };

  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    const which = editing;
    if (Platform.OS === 'android') setEditing(null);
    if (event.type === 'dismissed' || !date || !which) return;
    const minutes = date.getHours() * 60 + date.getMinutes();
    if (which === 'start') prefs.setQuietHours(minutes, prefs.quietEnd);
    else prefs.setQuietHours(prefs.quietStart, minutes);
  };

  const disabled = prefs.allOff;
  const quietNow = isInQuietHours(prefs);

  const permissionText =
    permission === 'granted' ? 'চালু আছে ✅' : permission === 'denied' ? 'বন্ধ — সেটিংস থেকে চালু করুন' : 'এখনো অনুমতি দেওয়া হয়নি';

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {/* OS permission */}
      <View
        style={[
          styles.permission,
          {
            backgroundColor: permission === 'granted' ? colors.primarySoft : colors.warningSoft,
            borderColor: permission === 'granted' ? colors.primary : colors.warning,
          },
        ]}
      >
        <View style={styles.flex}>
          <AppText variant="body" style={styles.bold}>
            ফোনের নোটিফিকেশন অনুমতি
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {permissionText}
          </AppText>
        </View>
        {permission !== 'granted' ? (
          <Button
            title={permission === 'denied' ? 'সেটিংস খুলুন' : 'চালু করুন'}
            size="sm"
            onPress={askPermission}
          />
        ) : null}
      </View>

      <ListSection title="কী জানাবো">
        <ListRow emoji="💬" label="চ্যাট মেসেজ" subtitle="নতুন মেসেজ এলে" switchValue={prefs.chat} onSwitchChange={(v) => prefs.setPref('chat', v)} disabled={disabled} />
        <ListRow
          emoji="📢"
          label="বিজ্ঞাপনের আপডেট"
          subtitle="অনুমোদন, বাতিল ও মেয়াদ শেষের রিমাইন্ডার"
          switchValue={prefs.listing}
          onSwitchChange={(v) => prefs.setPref('listing', v)}
          disabled={disabled}
        />
        <ListRow
          emoji="🪪"
          label="ভেরিফিকেশন আপডেট"
          subtitle="NID যাচাইয়ের ফলাফল"
          switchValue={prefs.kyc}
          onSwitchChange={(v) => prefs.setPref('kyc', v)}
          disabled={disabled}
        />
        <ListRow
          emoji="🔕"
          label="সব বন্ধ"
          subtitle="সব নোটিফিকেশন ও ব্যানার বন্ধ থাকবে"
          switchValue={prefs.allOff}
          onSwitchChange={(v) => prefs.setPref('allOff', v)}
          isLast
        />
      </ListSection>

      <ListSection title="নীরব সময়">
        <ListRow
          emoji="🌙"
          label="নীরব সময় চালু করুন"
          subtitle={quietNow ? 'এখন নীরব সময় চলছে' : 'এই সময়ে শব্দ ও পপ-আপ বন্ধ থাকবে'}
          switchValue={prefs.quietHoursEnabled}
          onSwitchChange={(v) => prefs.setPref('quietHoursEnabled', v)}
          disabled={disabled}
          isLast={!prefs.quietHoursEnabled}
        />
        {prefs.quietHoursEnabled ? (
          <>
            <ListRow emoji="⏰" label="শুরু" value={formatMinutes(prefs.quietStart)} onPress={() => setEditing('start')} disabled={disabled} />
            <ListRow emoji="☀️" label="শেষ" value={formatMinutes(prefs.quietEnd)} onPress={() => setEditing('end')} disabled={disabled} isLast />
          </>
        ) : null}
      </ListSection>

      <AppText variant="caption" color={colors.textMuted} style={styles.note}>
        নীরব সময়েও অ্যাপ খোলা থাকলে উপরের ছোট ব্যানারে আপডেট দেখাবে — শুধু শব্দ ও ফোনের নোটিফিকেশন বন্ধ থাকে।
      </AppText>

      {editing ? (
        Platform.OS === 'ios' ? (
          <View style={[styles.iosPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DateTimePicker
              value={minutesToDate(editing === 'start' ? prefs.quietStart : prefs.quietEnd)}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
            />
            <Pressable onPress={() => setEditing(null)} style={styles.done}>
              <AppText variant="body" color={colors.primary} style={styles.bold}>
                সম্পন্ন
              </AppText>
            </Pressable>
          </View>
        ) : (
          <DateTimePicker
            value={minutesToDate(editing === 'start' ? prefs.quietStart : prefs.quietEnd)}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  content: { paddingVertical: 16, paddingBottom: 48 },
  permission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  note: { marginHorizontal: 20, marginTop: -8 },
  iosPicker: { margin: 16, borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  done: { alignItems: 'center', paddingVertical: 12 },
});
