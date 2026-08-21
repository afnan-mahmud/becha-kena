import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './components/providers/AppProviders';
import { useAuthStore } from './store/authStore';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AppRouter } from './routes/AppRouter';

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
    <BrowserRouter>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
