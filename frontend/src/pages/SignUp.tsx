import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, GoogleIcon } from '@/components/ui';
import logoLockup from '@/assets/logo-lockup.svg';
import { useAuth } from '@/contexts/AuthContext';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

const BrandPanel = (
  <div style={{
    flex: '1 1 46%', background: 'var(--grad-mesh), var(--bg-surface)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '44px 48px',
  }}>
    <img src={logoLockup} style={{ height: 36 }} alt="RadReport AI" />
    <div>
      <div className="t-overline" style={{ color: 'var(--rose-700)', marginBottom: 16 }}>
        Earlier detection · clearer decisions
      </div>
      <h1 style={{
        fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 600,
        letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--fg-1)',
        margin: '0 0 18px', maxWidth: 460,
      }}>
        Every report, read with care.
      </h1>
      <p className="t-body-lg" style={{ maxWidth: 420, margin: 0 }}>
        Secure PDF upload, AI-driven extraction, and longitudinal patient management — built for breast imaging teams.
      </p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)', fontSize: 12.5 }}>
      <Icon name="shield" size={15} color="var(--success-700)" />
      HIPAA-aligned · SOC 2 Type II · end-to-end encrypted
    </div>
  </div>
);

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ height: '100vh', display: 'flex' }}>
        {BrandPanel}
        <div style={{
          flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 40,
          borderLeft: '1px solid var(--border-1)',
        }}>
          <div style={{ width: '100%', maxWidth: 360 }} className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--success-100)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Icon name="check" size={28} color="var(--success-700)" />
              </div>
              <h2 className="t-h2" style={{ marginBottom: 6 }}>Check your email</h2>
              <p className="t-body" style={{ margin: 0, color: 'var(--fg-3)' }}>
                We've sent a confirmation link to <strong>{email}</strong>.
                Click it to activate your account, then sign in.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 12 }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {BrandPanel}
      <div style={{
        flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 40,
        borderLeft: '1px solid var(--border-1)',
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <h2 className="t-h2" style={{ marginBottom: 6 }}>Create account</h2>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 24 }}>
            Join your clinical workspace.
          </p>

          {error && (
            <div style={{
              background: 'var(--error-100)', border: '1px solid var(--error-200)',
              borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 16,
              color: 'var(--error-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, gap: 10, marginBottom: 16, opacity: googleLoading ? 0.6 : 1 }}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-4)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
          </div>

          <label htmlFor="signup-name" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Full name
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="user" size={17} />
            </span>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <label htmlFor="signup-email" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Work email
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="mail" size={17} />
            </span>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <label htmlFor="signup-password" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="lock" size={17} />
            </span>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              style={INPUT_STYLE}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--fg-3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
