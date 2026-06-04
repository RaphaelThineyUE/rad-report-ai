import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '10px 12px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h3 className="t-h4" style={{ margin: '0 0 18px' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Profile() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg('');
    setNameLoading(true);
    try {
      await api.patch('/api/auth/me', { displayName });
      setNameMsg('Display name updated.');
    } catch {
      setNameMsg('Failed to update display name.');
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwMsg('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-head" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="t-h2" style={{ margin: 0 }}>Account settings</h1>
          <div className="sub">{session?.user.email}</div>
        </div>
      </div>

      <Section title="Profile">
        <form onSubmit={handleUpdateName}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={{ ...INPUT_STYLE, marginBottom: 14 }}
          />
          {nameMsg && (
            <div style={{ fontSize: 13, color: 'var(--success-700)', marginBottom: 12 }}>{nameMsg}</div>
          )}
          <button type="submit" className="btn btn-secondary btn-sm" disabled={nameLoading}>
            {nameLoading ? <Icon name="loader" size={14} className="spin" /> : 'Save changes'}
          </button>
        </form>
      </Section>

      <Section title="Change password">
        <form onSubmit={handleChangePassword}>
          {pwError && (
            <div style={{
              background: 'var(--danger-50)', color: 'var(--danger-700)', border: '1px solid var(--danger-500)',
              borderRadius: 'var(--r-sm)', padding: '9px 13px', fontSize: 13.5, marginBottom: 14,
            }}>
              {pwError}
            </div>
          )}
          {pwMsg && (
            <div style={{ fontSize: 13, color: 'var(--success-700)', marginBottom: 12 }}>{pwMsg}</div>
          )}
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            New password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            style={{ ...INPUT_STYLE, marginBottom: 14 }}
          />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            required
            style={{ ...INPUT_STYLE, marginBottom: 14 }}
          />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={pwLoading}>
            {pwLoading ? <Icon name="loader" size={14} className="spin" /> : 'Update password'}
          </button>
        </form>
      </Section>

      <Section title="Session">
        <p className="t-body-sm" style={{ margin: '0 0 14px' }}>
          Signed in as <strong>{session?.user.email}</strong>.
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--danger-700)' }}
        >
          <Icon name="log-out" size={15} color="var(--danger-700)" />
          Sign out
        </button>
      </Section>
    </div>
  );
}
