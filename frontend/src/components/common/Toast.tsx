import { Toaster } from 'react-hot-toast';

export const Toast = () => {
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-white)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
        success: {
          iconTheme: {
            primary: '#10b981', // green accent
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444', // red accent
            secondary: '#fff',
          },
        },
        loading: {
          iconTheme: {
            primary: 'var(--primary-color)', // blue spinner
            secondary: '#e5e7eb',
          },
        },
      }} 
    />
  );
};
