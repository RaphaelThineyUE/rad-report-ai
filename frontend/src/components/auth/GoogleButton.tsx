// frontend/src/components/auth/GoogleButton.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function GoogleButton() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');

  async function handleClick() {
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Could not sign in with Google. Please try again.');
    }
  }

  return (
    <div>
      {error && (
        <div role="alert" style={{
          background: 'var(--error-100)', border: '1px solid var(--error-200)',
          borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 12,
          color: 'var(--error-700)', fontSize: 13,
        }}>
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        className="btn"
        aria-label="Continue with Google"
        style={{
          width: '100%', justifyContent: 'center', padding: 12,
          border: '1px solid var(--border-2)', background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
