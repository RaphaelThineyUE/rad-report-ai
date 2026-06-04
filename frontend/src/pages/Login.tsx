import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui';
import logoLockup from '@/assets/logo-lockup.svg';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

export default function Login() {
  const [email, setEmail] = useState('r.kaur@stmary-imaging.org');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.session) {
        setError(signInError?.message || 'Failed to sign in');
        return;
      }

      navigate('/worklist');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Left: brand panel */}
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

      {/* Right: form */}
      <div style={{
        flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 40,
        borderLeft: '1px solid var(--border-1)',
      }}>
        <form onSubmit={handleSignIn} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <h2 className="t-h2" style={{ marginBottom: 6 }}>Sign in</h2>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 28 }}>
            Use your clinical workspace credentials.
          </p>

          {error && (
            <div style={{
              background: 'var(--error-100)', border: '1px solid var(--error-200)',
              borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 16,
              color: 'var(--error-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}

          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Work email
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="mail" size={17} />
            </span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="lock" size={17} />
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22 }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{ fontSize: 13, color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in securely'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, color: 'var(--fg-4)', fontSize: 11.5 }}>
            <Icon name="shield" size={13} />
            Protected by single sign-on &amp; audit logging
          </div>
        </form>
      </div>
    </div>
  );
}
