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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logoLockup} style={{ height: 32, marginBottom: 24 }} alt="RadReport AI" />
        </div>

        <div className="card card-pad" style={{ padding: '36px 40px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'var(--success-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
              }}>
                <Icon name="mail" size={26} color="var(--success-700)" />
              </div>
              <h2 className="t-h3" style={{ marginBottom: 10 }}>Check your inbox</h2>
              <p className="t-body" style={{ margin: '0 0 24px' }}>
                We sent a password reset link to <strong>{email}</strong>. Check your email and follow the link.
              </p>
              <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="t-h3" style={{ marginBottom: 8 }}>Reset your password</h2>
              <p className="t-body" style={{ margin: '0 0 24px' }}>
                Enter your work email and we'll send you a reset link.
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
              <div style={{ position: 'relative', marginBottom: 20 }}>
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

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 12 }}
                disabled={loading}
              >
                {loading ? <Icon name="loader" size={16} className="spin" /> : 'Send reset link'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'var(--fg-3)' }}>
                <Link to="/login" style={{ color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none' }}>
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
