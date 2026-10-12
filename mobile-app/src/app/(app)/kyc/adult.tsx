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
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ApiError } from '@/services/api';
import { kycService } from '@/services/kyc.service';
import { mediaService } from '@/services/media.service';
import { useAuthStore } from '@/store/auth.store';
import { KycProgressBar } from '@/components/kyc/KycProgressBar';
import { KycSelfieStep } from '@/components/kyc/KycSelfieStep';
import { validateNid, maskNid, formatDate, isAdult } from '@/components/kyc/kycHelpers';
import { s } from '@/components/kyc/kycStyles';

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEP_LABELS = ['NID তথ্য', 'সেলফি', 'জমা দিন'];

// ─── Step 1 — NID Info ────────────────────────────────────────────────────────

interface Step1Props {
  nid: string;
  setNid: (v: string) => void;
  dob: Date;
  setDob: (v: Date) => void;
  nidError: string | null;
  dobError: string | null;
  onNext: () => void;
}

function Step1NidInfo({ nid, setNid, dob, setDob, nidError, dobError, onNext }: Step1Props) {
  const [showPicker, setShowPicker] = useState(false);
  const today = new Date();

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setDob(selected);
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.stepContainer} keyboardShouldPersistTaps="handled">
      <Text style={s.stepTitle}>NID তথ্য দিন</Text>
      <Text style={s.stepSubtitle}>আপনার জাতীয় পরিচয়পত্রের তথ্য সঠিকভাবে পূরণ করুন</Text>

      {/* NID input */}
      <View style={s.fieldWrap}>
        <Text style={s.label}>NID নম্বর</Text>
        <TextInput
          style={[s.input, nidError ? s.inputError : null]}
          value={nid}
          onChangeText={setNid}
          keyboardType="numeric"
          maxLength={17}
          placeholder="আপনার NID নম্বর লিখুন"
          placeholderTextColor="#B0B8B4"
        />
        {nidError ? <Text style={s.errorText}>{nidError}</Text> : null}
        <Text style={s.hint}>১০, ১৩ বা ১৭ সংখ্যার NID নম্বর</Text>
      </View>

      {/* DOB picker */}
      <View style={s.fieldWrap}>
        <Text style={s.label}>জন্ম তারিখ</Text>
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

// ─── Step 3 — Review & Submit ─────────────────────────────────────────────────

interface Step3Props {
  nid: string;
  dob: Date;
  selfieUri: string;
  onSubmit: () => void;
  submitting: boolean;
  onBack: () => void;
}

function Step3Review({ nid, dob, selfieUri, onSubmit, submitting, onBack }: Step3Props) {
  return (
    <ScrollView style={s.flex} contentContainerStyle={s.stepContainer}>
      <Text style={s.stepTitle}>তথ্য পর্যালোচনা করুন</Text>
      <Text style={s.stepSubtitle}>জমা দেওয়ার আগে তথ্যগুলো যাচাই করুন</Text>

      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <Text style={s.summaryKey}>NID নম্বর</Text>
          <Text style={s.summaryValue}>{maskNid(nid)}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryRow}>
          <Text style={s.summaryKey}>জন্ম তারিখ</Text>
          <Text style={s.summaryValue}>{formatDate(dob)}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryRow}>
          <Text style={s.summaryKey}>সেলফি</Text>
          <Image source={{ uri: selfieUri }} style={s.selfieThumb} />
        </View>
      </View>

      <View style={s.privacyNote}>
        <Text style={s.privacyIcon}>🔐</Text>
        <Text style={s.privacyText}>
          আপনার NID নম্বর আমরা সরাসরি সংরক্ষণ করি না — শুধু এনক্রিপ্টেড হ্যাশ রাখা হয়।
        </Text>
      </View>

      <View style={s.reviewActions}>
        <TouchableOpacity style={s.outlineBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={s.outlineBtnText}>← ফিরে যান</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.primaryBtn, submitting && s.btnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>জমা দিন</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function KycAdultScreen() {
  const router = useRouter();
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [nidError, setNidError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStep1Next = useCallback(() => {
    let valid = true;
    const nidErr = validateNid(nid);
    setNidError(nidErr);
    if (nidErr) valid = false;

    if (!isAdult(dob)) {
      setDobError('আপনার বয়স ১৮ বছরের কম — অপ্রাপ্তবয়স্ক ফ্লো ব্যবহার করুন');
      valid = false;
    } else {
      setDobError(null);
    }

    if (valid) setStep(2);
  }, [nid, dob]);

  const handleSelfieDone = useCallback(() => {
    if (!selfieUri) {
      Alert.alert('সেলফি প্রয়োজন', 'পরবর্তী ধাপে যেতে আগে একটি সেলফি তুলুন।');
      return;
    }
    setStep(3);
  }, [selfieUri]);

  const handleSubmit = useCallback(async () => {
    if (!selfieUri) return;
    setSubmitting(true);

    try {
      const selfieUrl = await mediaService.uploadImage(selfieUri, 'kyc');
      const pending = await kycService.submitAdult({
        nidNumber: nid,
        dob: formatDate(dob),
        selfieUrl,
      });
      if (pending) {
        router.replace('/(app)/kyc/status');
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';

      if (code === 'KYC_LIMIT_REACHED') {
        Alert.alert('সীমা পৌঁছে গেছে', 'আজ ৩ বার চেষ্টা হয়ে গেছে, আগামীকাল আবার চেষ্টা করুন।');
      } else if (code === 'KYC_PENDING') {
        router.replace('/(app)/kyc/status');
      } else if (code === 'ALREADY_VERIFIED') {
        await refreshUser();
        router.replace('/');
      } else if (code === 'NID_BANNED') {
        Alert.alert('NID নিষিদ্ধ', 'এই NID নিষিদ্ধ।');
      } else if (code === 'INVALID_NID') {
        setStep(1);
        setNidError('NID নম্বরটি সঠিক নয়');
      } else if (code === 'INVALID_DOB') {
        setStep(1);
        setDobError('জন্ম তারিখটি সঠিক নয়');
      } else if (code === 'UNDERAGE') {
        setStep(1);
        setDobError('আপনার বয়স ১৮ বছরের কম — অপ্রাপ্তবয়স্ক ফ্লো ব্যবহার করুন');
      } else {
        const msg = err instanceof ApiError ? err.message : 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।';
        Alert.alert('ত্রুটি', msg);
      }
    } finally {
      setSubmitting(false);
    }
  }, [nid, dob, selfieUri, refreshUser]);

  return (
    <View style={s.screen}>
      <KycProgressBar step={step} labels={STEP_LABELS} />

      {step === 1 && (
        <Step1NidInfo
          nid={nid}
          setNid={setNid}
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
        />
      )}
      {step === 3 && selfieUri && (
        <Step3Review
          nid={nid}
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
