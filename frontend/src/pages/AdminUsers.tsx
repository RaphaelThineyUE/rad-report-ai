/**
 * AdminUsers page — user management list; accessible to org-admin role only.
 * Fetches all users from GET /admin/users on mount and on manual refresh.
 * Left panel: scrollable list of users. Right panel: selected user details
 * (email, creation date, patient/report counts) with a Remove User action button.
 */
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  created_at: string;
  patient_count: number;
  report_count: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="fade-up"><div className="page-head"><h1 className="t-h1">Loading...</h1></div></div>;
  }

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">User Management</h1>
          <div className="sub">Manage users and their access</div>
        </div>
        <button onClick={fetchUsers} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--slate-300)', background: 'white', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        <div className="card card-pad" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Users ({users.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                style={{
                  padding: 12,
                  border: selectedUser?.id === user.id ? '2px solid var(--blue-500)' : '1px solid var(--slate-200)',
                  borderRadius: 6,
                  background: selectedUser?.id === user.id ? 'var(--blue-50)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 2 }}>{user.email.split('@')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{user.report_count} reports</div>
              </button>
            ))}
          </div>
        </div>

        {selectedUser && (
          <div className="card card-pad">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>User Details</h3>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', display: 'block', marginBottom: 4 }}>Email</label>
              <div style={{ fontSize: 14, color: 'var(--fg-1)' }}>{selectedUser.email}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', display: 'block', marginBottom: 4 }}>Account Created</label>
              <div style={{ fontSize: 14, color: 'var(--fg-1)' }}>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ padding: 12, background: 'var(--slate-50)' }}>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>Patients</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--blue-600)' }}>{selectedUser.patient_count}</div>
              </div>
              <div className="card" style={{ padding: 12, background: 'var(--slate-50)' }}>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 4 }}>Reports</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--blue-600)' }}>{selectedUser.report_count}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: 16, display: 'flex', gap: 12 }}>
              <button
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--danger-300)',
                  background: 'var(--danger-50)',
                  color: 'var(--danger-600)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Remove User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
