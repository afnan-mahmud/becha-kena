import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from './components/providers/AppProviders';
import { useAuthStore } from './store/authStore';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { HomePage } from './pages/home/HomePage';

function AppContent() {
  const { isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Add more routes here as we build them */}
          </Routes>
        </Layout>
      } />
    </Routes>
  );
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
