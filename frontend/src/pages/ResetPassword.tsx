import { useState, useEffect } from 'react';
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

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    verifyResetToken();
  }, []);

  async function verifyResetToken() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setTokenError('Invalid or expired reset link. Please request a new password reset.');
      return;
    }
    setValidToken(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (tokenError) {
    return (
      <div style={{ height: '100vh', display: 'flex' }}>
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

        <div style={{
          flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 40,
          borderLeft: '1px solid var(--border-1)',
        }}>
          <div style={{ width: '100%', maxWidth: 360 }} className="fade-up">
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--error-100)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Icon name="alert-circle" size={28} color="var(--error-700)" />
              </div>
              <h2 className="t-h2" style={{ marginBottom: 6 }}>Invalid reset link</h2>
              <p className="t-body" style={{ margin: 0, color: 'var(--fg-3)', marginBottom: 24 }}>
                {tokenError}
              </p>

              <button
                onClick={() => navigate('/forgot-password')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 12 }}
              >
                Request new link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ height: '100vh', display: 'flex' }}>
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
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Icon name="check" size={28} color="var(--success-700)" />
              </div>
              <h2 className="t-h2" style={{ marginBottom: 6 }}>Password reset successful</h2>
              <p className="t-body" style={{ margin: 0, color: 'var(--fg-3)' }}>
                Your password has been updated. Redirecting to sign in...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
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

      <div style={{
        flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 40,
        borderLeft: '1px solid var(--border-1)',
      }}>
        {!validToken ? (
          <div style={{ width: '100%', maxWidth: 360 }} className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--error-100)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Icon name="alert-circle" size={28} color="var(--error-700)" />
              </div>
              <h2 className="t-h2" style={{ marginBottom: 6 }}>Invalid reset link</h2>
              <p className="t-body" style={{ margin: 0, color: 'var(--fg-3)', marginBottom: 24 }}>
                This reset link is invalid or has expired.
              </p>

              <button
                onClick={() => navigate('/forgot-password')}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: 12 }}
              >
                Request a new link
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <h2 className="t-h2" style={{ marginBottom: 6 }}>Create new password</h2>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 28, color: 'var(--fg-3)' }}>
            Enter a new password for your account.
          </p>

          {error && (
            <div style={{
              background: 'var(--error-100)', border: '1px solid var(--error-200)',
              borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 16,
              color: 'var(--error-700)', fontSize: 13
            }}>
              {error}
            </div>
          )}

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
              style={INPUT_STYLE}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
