import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ApiError } from '@/services/api';
import { kycService } from '@/services/kyc.service';
import { mediaService } from '@/services/media.service';
import { useAuthStore } from '@/store/auth.store';
import { KycProgressBar } from '@/components/kyc/KycProgressBar';
import { KycSelfieStep } from '@/components/kyc/KycSelfieStep';
import { validateNid, maskNid, formatDate, isMinor } from '@/components/kyc/kycHelpers';
import { s } from '@/components/kyc/kycStyles';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['অভিভাবক NID', 'অভিভাবক সেলফি', 'সম্মতি ও জমা'];

const CONSENT_TEXT =
  'আমি নিশ্চিত করছি যে আমার অভিভাবক এই অ্যাকাউন্ট ব্যবহারে সম্মতি দিয়েছেন এবং প্রদত্ত NID তাঁর।';

// ─── Step 1 — Parent NID + Minor's DOB ───────────────────────────────────────

interface Step1Props {
  parentNid: string;
  setParentNid: (v: string) => void;
  dob: Date;
  setDob: (v: Date) => void;
  nidError: string | null;
  dobError: string | null;
  onNext: () => void;
}

function Step1ParentNid({
  parentNid,
  setParentNid,
  dob,
  setDob,
  nidError,
  dobError,
  onNext,
}: Step1Props) {
  const [showPicker, setShowPicker] = useState(false);
  const today = new Date();

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDob(selected);
  };

  return (
    <ScrollView
      style={s.flex}
      contentContainerStyle={s.stepContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.stepTitle}>অভিভাবকের তথ্য দিন</Text>
      <Text style={s.stepSubtitle}>
        আপনার বাবা/মা বা অভিভাবকের NID নম্বর এবং আপনার নিজের জন্ম তারিখ পূরণ করুন
      </Text>

      {/* Parent NID */}
      <View style={s.fieldWrap}>
        <Text style={s.label}>অভিভাবকের NID নম্বর</Text>
        <TextInput
          style={[s.input, nidError ? s.inputError : null]}
          value={parentNid}
          onChangeText={setParentNid}
          keyboardType="numeric"
          maxLength={17}
          placeholder="অভিভাবকের NID নম্বর লিখুন"
          placeholderTextColor="#B0B8B4"
        />
        {nidError ? <Text style={s.errorText}>{nidError}</Text> : null}
        <Text style={s.hint}>১০, ১৩ বা ১৭ সংখ্যার NID নম্বর</Text>
      </View>

      {/* Minor's DOB */}
      <View style={s.fieldWrap}>
        <Text style={s.label}>আপনার জন্ম তারিখ (অপ্রাপ্তবয়স্ক)</Text>
        <TouchableOpacity
          style={[s.input, s.dateRow, dobError ? s.inputError : null]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={[s.dateText, !dob && s.placeholderText]}>{formatDate(dob)}</Text>
          <Text style={s.calIcon}>📅</Text>
        </TouchableOpacity>
        {dobError ? <Text style={s.errorText}>{dobError}</Text> : null}

        {showPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={today}
            onChange={handleDateChange}
          />
        )}
        {Platform.OS === 'ios' && showPicker && (
          <TouchableOpacity style={s.doneBtn} onPress={() => setShowPicker(false)}>
            <Text style={s.doneBtnText}>সম্পন্ন</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>পরবর্তী →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 3 — Consent & Submit ────────────────────────────────────────────────

interface Step3Props {
  parentNid: string;
  dob: Date;
  selfieUri: string;
  onSubmit: () => void;
  submitting: boolean;
  onBack: () => void;
}

function Step3ConsentSubmit({
  parentNid,
  dob,
  selfieUri,
  onSubmit,
  submitting,
  onBack,
}: Step3Props) {
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.stepContainer}>
      <Text style={s.stepTitle}>তথ্য পর্যালোচনা ও সম্মতি</Text>
      <Text style={s.stepSubtitle}>জমা দেওয়ার আগে তথ্যগুলো যাচাই করুন</Text>

      {/* Summary card */}
      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <Text style={s.summaryKey}>অভিভাবক NID</Text>
          <Text style={s.summaryValue}>{maskNid(parentNid)}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryRow}>
          <Text style={s.summaryKey}>জন্ম তারিখ</Text>
          <Text style={s.summaryValue}>{formatDate(dob)}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryRow}>
          <Text style={s.summaryKey}>অভিভাবক সেলফি</Text>
          <Image source={{ uri: selfieUri }} style={s.selfieThumb} />
        </View>
      </View>

      {/* Consent checkbox */}
      <TouchableOpacity
        style={[ms.consentBox, consentChecked && ms.consentBoxChecked]}
        onPress={() => setConsentChecked((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[ms.checkbox, consentChecked && ms.checkboxChecked]}>
          {consentChecked && <Text style={ms.checkmark}>✓</Text>}
        </View>
        <Text style={ms.consentText}>{CONSENT_TEXT}</Text>
      </TouchableOpacity>

      {/* Privacy note */}
      <View style={s.privacyNote}>
        <Text style={s.privacyIcon}>🔐</Text>
        <Text style={s.privacyText}>
          অভিভাবকের NID নম্বর আমরা সরাসরি সংরক্ষণ করি না — শুধু এনক্রিপ্টেড হ্যাশ রাখা হয়।
        </Text>
      </View>

      <View style={s.reviewActions}>
        <TouchableOpacity style={s.outlineBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={s.outlineBtnText}>← ফিরে যান</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.primaryBtn, (!consentChecked || submitting) && s.btnDisabled]}
          onPress={onSubmit}
          disabled={!consentChecked || submitting}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>জমা দিন</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function KycMinorScreen() {
  const router = useRouter();
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parentNid, setParentNid] = useState('');
  const [dob, setDob] = useState<Date>(new Date(2010, 0, 1));
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [nidError, setNidError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  const handleStep1Next = useCallback(() => {
    let valid = true;

    const nidErr = validateNid(parentNid);
    setNidError(nidErr);
    if (nidErr) valid = false;

    // The user's OWN DOB must be under 18
    if (!isMinor(dob)) {
      setDobError('আপনার বয়স ১৮ বছর বা তার বেশি — প্রাপ্তবয়স্ক ফ্লো ব্যবহার করুন');
      valid = false;
    } else {
      setDobError(null);
    }

    if (valid) setStep(2);
  }, [parentNid, dob]);

  // ── Step 2 → 3 ────────────────────────────────────────────────────────────
  const handleSelfieDone = useCallback(() => {
    if (!selfieUri) {
      Alert.alert('সেলফি প্রয়োজন', 'পরবর্তী ধাপে যেতে আগে অভিভাবকের সেলফি তুলুন।');
      return;
    }
    setStep(3);
  }, [selfieUri]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!selfieUri) return;
    setSubmitting(true);

    try {
      const parentSelfieUrl = await mediaService.uploadImage(selfieUri, 'kyc');
      const pending = await kycService.submitMinor({
        parentNidNumber: parentNid,
        dob: formatDate(dob),
        parentSelfieUrl,
        consentConfirmed: true,
      });
      if (pending) {
        router.replace('/(app)/kyc/status');
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';

      if (code === 'KYC_LIMIT_REACHED') {
        Alert.alert('সীমা পৌঁছে গেছে', 'আজ ৩ বার চেষ্টা হয়ে গেছে, আগামীকাল আবার চেষ্টা করুন।');
      } else if (code === 'PARENT_NID_LIMIT') {
        Alert.alert(
          'অভিভাবক NID সীমা',
          'এই অভিভাবকের NID দিয়ে ইতিমধ্যে ৩টি অ্যাকাউন্ট খোলা হয়েছে।'
        );
      } else if (code === 'NOT_A_MINOR') {
        setStep(1);
        setDobError('আপনার বয়স ১৮ বছর বা তার বেশি — প্রাপ্তবয়স্ক ফ্লো ব্যবহার করুন');
      } else if (code === 'CONSENT_REQUIRED') {
        setStep(3);
        Alert.alert('সম্মতি প্রয়োজন', 'জমা দিতে সম্মতির চেকবক্স পূরণ করুন।');
      } else if (code === 'KYC_PENDING') {
        router.replace('/(app)/kyc/status');
      } else if (code === 'ALREADY_VERIFIED') {
        await refreshUser();
        router.replace('/');
      } else if (code === 'NID_BANNED') {
        Alert.alert('NID নিষিদ্ধ', 'এই অভিভাবকের NID নিষিদ্ধ।');
      } else if (code === 'INVALID_NID') {
        setStep(1);
        setNidError('অভিভাবকের NID নম্বরটি সঠিক নয়');
      } else if (code === 'INVALID_DOB') {
        setStep(1);
        setDobError('জন্ম তারিখটি সঠিক নয়');
      } else {
        const msg =
          err instanceof ApiError ? err.message : 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।';
        Alert.alert('ত্রুটি', msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [parentNid, dob, selfieUri, refreshUser]);

  return (
    <View style={s.screen}>
      <KycProgressBar step={step} labels={STEP_LABELS} />

      {step === 1 && (
        <Step1ParentNid
          parentNid={parentNid}
          setParentNid={setParentNid}
          dob={dob}
          setDob={setDob}
          nidError={nidError}
          dobError={dobError}
          onNext={handleStep1Next}
        />
      )}

      {step === 2 && (
        <KycSelfieStep
          selfieUri={selfieUri}
          setSelfieUri={setSelfieUri}
          onNext={handleSelfieDone}
          hint="অভিভাবকের মুখ ডিম্বাকৃতির ভেতরে রাখুন, ভালো আলোতে, চশমা/মাস্ক ছাড়া"
          previewTitle="অভিভাবকের সেলফি প্রিভিউ"
        />
      )}

      {step === 3 && selfieUri && (
        <Step3ConsentSubmit
          parentNid={parentNid}
          dob={dob}
          selfieUri={selfieUri}
          onSubmit={handleSubmit}
          submitting={submitting}
          onBack={() => setStep(2)}
        />
      )}

      <Modal transparent visible={submitting} animationType="fade">
        <View style={s.loadingOverlay}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color="#00704A" />
            <Text style={s.loadingText}>জমা দেওয়া হচ্ছে…</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Minor-specific styles ────────────────────────────────────────────────────

const ms = StyleSheet.create({
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7E3DA',
    marginBottom: 20,
  },
  consentBoxChecked: {
    borderColor: '#00704A',
    backgroundColor: '#F0FAF5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#B0B8B4',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#00704A',
    borderColor: '#00704A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: '#1B2420',
    lineHeight: 22,
  },
});
