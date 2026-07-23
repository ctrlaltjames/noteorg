import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/Auth/LoginPage';
import Header from './components/Layout/Header';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-dark-bg">
        <div class="text-dark-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div class="h-screen flex flex-col">
      <Header />
      <main class="flex-1 overflow-hidden">
        {user ? (
          <div class="flex items-center justify-center h-full text-dark-secondary">
            <p>Coming soon — Phase 2: Artifact management</p>
          </div>
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
