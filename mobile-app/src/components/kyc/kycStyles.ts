import { StyleSheet } from 'react-native';

/**
 * Shared styles used across all KYC step screens.
 * Extracted from adult.tsx so minor.tsx can reuse them without duplication.
 */
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5F0' },
  flex: { flex: 1 },
  stepContainer: { padding: 20, paddingBottom: 40 },

  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1B2420', marginBottom: 6 },
  stepSubtitle: { fontSize: 14, color: '#5B6660', marginBottom: 24, lineHeight: 21 },

  // Form fields
  fieldWrap: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1B2420', marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E3DA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1B2420',
  },
  inputError: { borderColor: '#E53E3E' },
  errorText: { fontSize: 12, color: '#E53E3E', marginTop: 5 },
  hint: { fontSize: 12, color: '#8F9892', marginTop: 5 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 15, color: '#1B2420' },
  placeholderText: { color: '#B0B8B4' },
  calIcon: { fontSize: 18 },
  doneBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#00704A',
    borderRadius: 8,
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  // Buttons
  primaryBtn: {
    backgroundColor: '#00704A',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#00704A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  outlineBtnText: { color: '#00704A', fontSize: 15, fontWeight: '600' },

  // Camera
  camera: { flex: 1 },
  ovalGuideOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  ovalGuide: {
    width: 220,
    height: 290,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
  },
  ovalHint: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  fallbackBtn: {
    backgroundColor: '#F7F5F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E7E3DA',
  },
  fallbackBtnText: { color: '#00704A', fontSize: 13, fontWeight: '600' },

  // Permission denied
  permDenied: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  permDeniedIcon: { fontSize: 48, marginBottom: 16 },
  permDeniedTitle: { fontSize: 18, fontWeight: '700', color: '#1B2420', marginBottom: 8 },
  permDeniedText: { fontSize: 14, color: '#5B6660', textAlign: 'center', marginBottom: 24 },
  settingsLink: { marginTop: 16 },
  settingsLinkText: { color: '#00704A', fontSize: 14, fontWeight: '600' },

  // Selfie preview
  selfiePreview: { flex: 1, marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' },
  selfieActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E3DA',
    overflow: 'hidden',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  summaryDivider: { height: 1, backgroundColor: '#F0EDE7', marginHorizontal: 18 },
  summaryKey: { fontSize: 14, color: '#5B6660', fontWeight: '500' },
  summaryValue: { fontSize: 15, color: '#1B2420', fontWeight: '600' },
  selfieThumb: { width: 56, height: 56, borderRadius: 10 },

  // Privacy note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F6D860',
    marginBottom: 24,
  },
  privacyIcon: { fontSize: 16, marginTop: 1 },
  privacyText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },

  // Review actions
  reviewActions: { flexDirection: 'row', gap: 12 },

  // Loading overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  loadingText: { fontSize: 16, fontWeight: '600', color: '#1B2420' },
});
