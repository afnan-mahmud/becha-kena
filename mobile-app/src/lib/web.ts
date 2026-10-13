import * as WebBrowser from 'expo-web-browser';
import { toast } from '@/lib/toast';

/** Opens Terms / Privacy / other web pages in an in-app browser */
export const openWebPage = (url: string) =>
  WebBrowser.openBrowserAsync(url, { toolbarColor: '#00704A', controlsColor: '#00704A' }).catch(() =>
    toast.error('পেজটি খোলা যায়নি')
  );
