import { useEffect, useRef } from 'react';

export const useDocumentTitle = (title: string, retainOnUnmount = false) => {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (!retainOnUnmount) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        document.title = defaultTitle.current || 'Becha-Kena — বাংলাদেশের নিরাপদ মার্কেটপ্লেস';
      }
    };
  }, [retainOnUnmount]);
};
