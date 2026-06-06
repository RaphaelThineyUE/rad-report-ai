/**
 * Settings page — account management for the authenticated user.
 * Sections: profile (name + email via PATCH /api/auth/me), password change, and danger zone (account deletion).
 * Loads current user from GET /api/auth/me on mount; redirects to /login on fetch failure.
 * Account deletion calls DELETE /api/auth/me then supabase.auth.signOut().
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px', boxShadow: 'var(--shadow-xs)',
  outline: 'none', boxSizing: 'border-box',
};

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function Settings() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setFullName(response.data.full_name || '');
      setEmail(response.data.email);
    } catch (err) {
      console.error('Failed to fetch user', err);
      navigate('/login');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updates: Record<string, string> = {};
      if (fullName !== (user?.full_name || '')) updates.full_name = fullName;
      if (email !== user?.email) updates.email = email;

      const response = await api.patch('/api/auth/me', updates);
      setUser(response.data);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.patch('/api/auth/me', { password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setError('');

    try {
      await api.delete('/api/auth/me');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      setError((err as any).response?.data?.error || 'Failed to delete account');
      setDeleteLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--fg-3)' }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <h1 className="t-h1" style={{ marginBottom: 8 }}>Settings</h1>
      <p className="t-body" style={{ color: 'var(--fg-3)', marginBottom: 32 }}>
        Manage your account settings and preferences
      </p>

      {/* Profile Section */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-md)', padding: 24, marginBottom: 24
      }}>
        <h2 className="t-h3" style={{ marginBottom: 2 }}>Profile</h2>
        <p className="t-body-sm" style={{ color: 'var(--fg-3)', marginBottom: 20 }}>
          Update your personal information
        </p>

        {error && (
          <div style={{
            background: 'var(--error-100)', border: '1px solid var(--error-200)',
            borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 20,
            color: 'var(--error-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Icon name="alert-circle" size={16} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'var(--success-100)', border: '1px solid var(--success-200)',
            borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 20,
            color: 'var(--success-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Icon name="check" size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-md)', padding: 24, marginBottom: 24
      }}>
        <h2 className="t-h3" style={{ marginBottom: 2 }}>Change password</h2>
        <p className="t-body-sm" style={{ color: 'var(--fg-3)', marginBottom: 20 }}>
          Update your password to keep your account secure
        </p>

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--error-200)',
        borderRadius: 'var(--r-md)', padding: 24
      }}>
        <h2 className="t-h3" style={{ marginBottom: 2, color: 'var(--error-700)' }}>Danger zone</h2>
        <p className="t-body-sm" style={{ color: 'var(--fg-3)', marginBottom: 20 }}>
          Delete your account and all associated data
        </p>

        {deleteConfirm ? (
          <div style={{
            background: 'var(--error-50)', border: '1px solid var(--error-200)',
            borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16
          }}>
            <p style={{ color: 'var(--error-700)', fontSize: 13, marginBottom: 16, margin: 0 }}>
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => handleDeleteAccount()}
                disabled={deleteLoading}
                className="btn"
                style={{
                  background: 'var(--error-600)', color: 'white', padding: 10,
                  opacity: deleteLoading ? 0.6 : 1
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn"
                style={{ background: 'var(--bg-surface)', color: 'var(--fg-1)', padding: 10 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn"
            style={{ background: 'var(--error-600)', color: 'white' }}
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
