import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './components/providers/AppProviders';
import { useAuthStore } from './store/authStore';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AppRouter } from './routes/AppRouter';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NetworkStatus } from './components/common/NetworkStatus';

function AppContent() {
  const { isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return <AppRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <NetworkStatus />
      <BrowserRouter>
        <AppProviders>
          <AppContent />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
