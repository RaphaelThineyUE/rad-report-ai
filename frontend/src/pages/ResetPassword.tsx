import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import logoLockup from '@/assets/logo-lockup.svg';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
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
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      navigate('/login');
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
          <h2 className="t-h3" style={{ marginBottom: 8 }}>Set new password</h2>
          <p className="t-body" style={{ margin: '0 0 24px' }}>
            Choose a strong password for your account.
          </p>

          {error && (
            <div style={{
              background: 'var(--danger-50)', color: 'var(--danger-700)', border: '1px solid var(--danger-500)',
              borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: 13.5, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              New password
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
              Confirm new password
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
              {loading ? <Icon name="loader" size={16} className="spin" /> : 'Update password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'var(--fg-3)' }}>
              <Link to="/login" style={{ color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none' }}>
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
