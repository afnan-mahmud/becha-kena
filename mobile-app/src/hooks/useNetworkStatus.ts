import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/** true when the device has a connection AND the internet is reachable */
export const isOnline = (state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) =>
  // isInternetReachable is null while unknown — treat unknown as online
  state.isConnected !== false && state.isInternetReachable !== false;

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => setOnline(isOnline(state)));
    NetInfo.fetch().then((state) => setOnline(isOnline(state))).catch(() => {});
    return unsubscribe;
  }, []);

  return { isConnected: online };
}

export default useNetworkStatus;
