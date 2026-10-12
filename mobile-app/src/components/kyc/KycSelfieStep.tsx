import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { s } from './kycStyles';

/**
 * Reusable selfie capture component shared by adult and minor KYC flows.
 *
 * Props:
 * - selfieUri: current captured URI (null if not yet taken)
 * - setSelfieUri: setter
 * - onNext: called when the user confirms the selfie
 * - hint (optional): overrides the default oval-guide hint text
 * - previewTitle (optional): overrides the preview screen title
 */
interface KycSelfieStepProps {
  selfieUri: string | null;
  setSelfieUri: (uri: string | null) => void;
  onNext: () => void;
  hint?: string;
  previewTitle?: string;
}

export function KycSelfieStep({
  selfieUri,
  setSelfieUri,
  onNext,
  hint = 'মুখ ডিম্বাকৃতির ভেতরে রাখুন, ভালো আলোতে, চশমা/মাস্ক ছাড়া',
  previewTitle = 'সেলফি প্রিভিউ',
}: KycSelfieStepProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(!!selfieUri);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo) {
        setSelfieUri(photo.uri);
        setCaptured(true);
      }
    } catch {
      Alert.alert('ত্রুটি', 'ছবি তোলা সম্ভব হয়নি, আবার চেষ্টা করুন।');
    }
  };

  const retake = () => {
    setSelfieUri(null);
    setCaptured(false);
  };

  // Fallback: launch native camera via ImagePicker
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'অনুমতি প্রয়োজন',
        'ক্যামেরা ব্যবহারের অনুমতি দিন।',
        [
          { text: 'বাতিল', style: 'cancel' },
          { text: 'সেটিংস খুলুন', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
      setCaptured(true);
    }
  };

  // ── Preview ──────────────────────────────────────────────────────────────────
  if (captured && selfieUri) {
    return (
      <View style={s.flex}>
        <Text style={[s.stepTitle, { textAlign: 'center', padding: 16 }]}>
          {previewTitle}
        </Text>
        <Image source={{ uri: selfieUri }} style={s.selfiePreview} resizeMode="cover" />
        <View style={s.selfieActions}>
          <TouchableOpacity style={s.outlineBtn} onPress={retake} activeOpacity={0.8}>
            <Text style={s.outlineBtnText}>আবার তুলুন</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>এটাই ঠিক আছে ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Permission denied ────────────────────────────────────────────────────────
  if (permission && !permission.granted) {
    return (
      <View style={[s.flex, s.permDenied]}>
        <Text style={s.permDeniedIcon}>📷</Text>
        <Text style={s.permDeniedTitle}>ক্যামেরার অনুমতি দিন</Text>
        <Text style={s.permDeniedText}>
          সেলফি তুলতে ক্যামেরার অ্যাক্সেস প্রয়োজন।
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>অনুমতি দিন</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.outlineBtn, { marginTop: 12 }]}
          onPress={pickFromCamera}
          activeOpacity={0.8}
        >
          <Text style={s.outlineBtnText}>গ্যালারি/ক্যামেরা থেকে বেছে নিন</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openSettings()} style={s.settingsLink}>
          <Text style={s.settingsLinkText}>সেটিংস খুলুন →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Live camera ──────────────────────────────────────────────────────────────
  return (
    <View style={s.flex}>
      <CameraView ref={cameraRef} style={s.camera} facing={'front' as CameraType}>
        <View style={s.ovalGuideOuter}>
          <View style={s.ovalGuide} />
        </View>
        <Text style={s.ovalHint}>{hint}</Text>
        <TouchableOpacity style={s.captureBtn} onPress={takePicture} activeOpacity={0.85}>
          <View style={s.captureBtnInner} />
        </TouchableOpacity>
      </CameraView>
      <TouchableOpacity style={s.fallbackBtn} onPress={pickFromCamera} activeOpacity={0.8}>
        <Text style={s.fallbackBtnText}>ক্যামেরা কাজ না করলে এখানে ট্যাপ করুন</Text>
      </TouchableOpacity>
    </View>
  );
}
