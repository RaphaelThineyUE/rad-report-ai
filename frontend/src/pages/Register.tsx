import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import logoLockup from '@/assets/logo-lockup.svg';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
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
            Join your imaging team today.
          </h1>
          <p className="t-body-lg" style={{ maxWidth: 420, margin: 0 }}>
            Create your account to access AI-assisted radiology reporting, patient management, and longitudinal tracking.
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
        {success ? (
          <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }} className="fade-up">
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--success-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Icon name="circle-check" size={28} color="var(--success-700)" />
            </div>
            <h2 className="t-h2" style={{ marginBottom: 10 }}>Check your email</h2>
            <p className="t-body" style={{ marginTop: 0, marginBottom: 24 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
            <h2 className="t-h2" style={{ marginBottom: 6 }}>Create account</h2>
            <p className="t-body" style={{ marginTop: 0, marginBottom: 28 }}>
              Set up your clinical workspace credentials.
            </p>

            {error && (
              <div style={{
                background: 'var(--danger-50)', color: 'var(--danger-700)', border: '1px solid var(--danger-500)',
                borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: 13.5, marginBottom: 16,
              }}>
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
                placeholder="you@hospital.org"
                style={INPUT_STYLE}
              />
            </div>

            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
                <Icon name="lock" size={17} />
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
                style={INPUT_STYLE}
              />
            </div>

            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              Confirm password
            </label>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
                <Icon name="lock" size={17} />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat your password"
                style={INPUT_STYLE}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 12 }}
              disabled={loading}
            >
              {loading ? <Icon name="loader" size={16} className="spin" /> : 'Create account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--fg-3)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
