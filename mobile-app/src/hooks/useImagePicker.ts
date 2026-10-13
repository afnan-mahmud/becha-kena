import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const openSettingsAlert = (what: string) =>
  Alert.alert('অনুমতি প্রয়োজন', `${what} ব্যবহারের অনুমতি দেওয়া হয়নি। সেটিংস থেকে অনুমতি দিন।`, [
    { text: 'বাতিল', style: 'cancel' },
    { text: 'সেটিংস খুলুন', onPress: () => Linking.openSettings() },
  ]);

/**
 * Camera / gallery helpers with permission handling.
 * Returns local URIs; uploading is done by ImagePickerGrid via media.service.
 */
export function useImagePicker() {
  const takePhoto = useCallback(async (): Promise<string[]> => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      openSettingsAlert('ক্যামেরা');
      return [];
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    return result.canceled ? [] : result.assets.map((a) => a.uri);
  }, []);

  const pickFromLibrary = useCallback(async (limit: number): Promise<string[]> => {
    // Android 13+ / iOS 14+ use the system photo picker, which needs no permission
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: limit > 1,
      selectionLimit: Math.max(1, limit),
      orderedSelection: true,
      quality: 1,
    });
    return result.canceled ? [] : result.assets.slice(0, limit).map((a) => a.uri);
  }, []);

  return { takePhoto, pickFromLibrary };
}

export default useImagePicker;
