import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { toBanglaDivision } from '@/constants/locations';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface UseLocationResult {
  coords: Coords | null;
  /** Bangla division name from reverse geocoding, if it could be resolved */
  division: string | null;
  loading: boolean;
  error: string | null;
  /** 'denied' lets the UI fall back to the manual LocationPicker */
  permission: 'unknown' | 'granted' | 'denied';
  request: () => Promise<{ coords: Coords; division: string | null } | null>;
}

/**
 * Current location with expo-location (Prompt 17):
 * foreground permission → current position (balanced accuracy) → reverse geocode → Bangla division.
 */
export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [division, setDivision] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<UseLocationResult['permission']>('unknown');

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        setError('লোকেশন অনুমতি দেওয়া হয়নি — নিচের তালিকা থেকে এলাকা বেছে নিন');
        return null;
      }
      setPermission('granted');

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(c);

      let div: string | null = null;
      try {
        const [address] = await Location.reverseGeocodeAsync(c);
        div = toBanglaDivision(address?.region) ?? toBanglaDivision(address?.subregion) ?? null;
      } catch {
        // reverse geocoding is best-effort (needs network / Play services)
      }
      setDivision(div);
      return { coords: c, division: div };
    } catch {
      setError('বর্তমান লোকেশন পাওয়া যায়নি — GPS চালু আছে কিনা দেখুন');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, division, loading, error, permission, request };
}

export default useLocation;
