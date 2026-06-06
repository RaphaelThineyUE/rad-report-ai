/**
 * ForgotPassword page — accepts a work email and POSTs to /api/auth/forgot-password.
 * On success transitions to a "check your email" confirmation view.
 * Uses the shared two-panel brand layout; no auth state required (unauthenticated route).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui';
import logoLockup from '@/assets/logo-lockup.svg';
import { api } from '@/lib/api';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
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
              <h2 className="t-h2" style={{ marginBottom: 6 }}>Check your email</h2>
              <p className="t-body" style={{ margin: 0, color: 'var(--fg-3)' }}>
                We've sent a password reset link to {email}
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
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', color: 'var(--fg-brand)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0,
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24
            }}
          >
            <Icon name="arrow-left" size={16} />
            Back to sign in
          </button>

          <h2 className="t-h2" style={{ marginBottom: 6 }}>Reset password</h2>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 28, color: 'var(--fg-3)' }}>
            Enter your email and we'll send you a link to reset your password.
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
            Work email
          </label>
          <div style={{ position: 'relative', marginBottom: 24 }}>
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

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
