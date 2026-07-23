import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header class="h-12 bg-dark-header border-b border-dark-border flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold text-dark-text">NoteOrg</span>
      </div>

      <div class="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          class="p-1.5 rounded text-dark-secondary hover:text-dark-text hover:bg-dark-border/50 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user && (
          <button
            onClick={signOut}
            class="text-sm text-dark-secondary hover:text-danger-dark transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
