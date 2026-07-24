import { AuthProvider, useAuth } from '@context/AuthContext';
import { ThemeProvider } from '@context/ThemeContext';
import { AppProvider } from '@context/AppContext';
import LoginPage from '@components/Auth/LoginPage';
import Header from '@components/Layout/Header';
import AppLayout from '@components/Layout/AppLayout';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center theme-bg-primary">
        <div class="theme-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div class="h-screen flex flex-col">
      <Header />
      <main class="flex-1 overflow-hidden">
        {user ? (
          <AppProvider user={user}>
            <AppLayout />
          </AppProvider>
        ) : (
          <LoginPage />
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
