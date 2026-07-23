import { useState } from 'preact/hooks';
import { useAuth } from '@context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp, signInWithGitHub } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setSignupSuccess(true);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setError('');
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(err.message || 'GitHub login failed');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-dark-text mb-2">NoteOrg</h1>
          <p class="text-dark-secondary">Notes + Artifact Organizer</p>
        </div>

        <div class="bg-dark-panel border border-dark-border rounded-lg p-6 shadow-lg">
          <h2 class="text-xl font-semibold text-dark-text mb-4 text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div class="bg-danger-dark/10 border border-danger-dark/30 text-danger-dark rounded p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {signupSuccess && (
            <div class="bg-success-dark/10 border border-success-dark/30 text-success-dark rounded p-3 mb-4 text-sm">
              <p class="font-medium mb-1">Check your email!</p>
              <p>We sent a confirmation link to <strong>{email}</strong>. Click the link to verify your account, then come back and sign in.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-dark-text mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                class="w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-dark-text mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minlength="6"
                class="w-full"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-primary-dark hover:bg-primary-dark/80 text-white font-medium py-2 px-4 transition-colors"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-dark-border"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-dark-panel text-dark-secondary">or</span>
            </div>
          </div>

          <button
            onClick={handleGitHub}
            class="w-full bg-dark-border hover:bg-dark-border/80 text-dark-text font-medium py-2 px-4 transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <p class="text-center text-sm text-dark-secondary mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSignupSuccess(false); }}
              class="text-accent-dark hover:underline font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
