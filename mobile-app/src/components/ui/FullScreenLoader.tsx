import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '@/constants/theme';
import { AppText } from './AppText';

export interface FullScreenLoaderProps {
  label?: string;
  /** Translucent overlay above the current screen (for submits) */
  overlay?: boolean;
  visible?: boolean;
}

/** Centered spinner + "লোড হচ্ছে…" (Prompt 44) */
export function FullScreenLoader({ label = 'লোড হচ্ছে…', overlay = false, visible = true }: FullScreenLoaderProps) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        overlay ? styles.overlay : { backgroundColor: colors.background },
      ]}
    >
      <View style={[styles.box, overlay && { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {label ? (
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.label}>
            {label}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        {content}
      </Modal>
    );
  }
  return visible ? content : null;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.35)' },
  box: { alignItems: 'center', padding: 24, borderRadius: 16, minWidth: 160 },
  label: { marginTop: 12 },
});

export default FullScreenLoader;
