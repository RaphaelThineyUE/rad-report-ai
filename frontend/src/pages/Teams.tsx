import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Button } from '@/components/ui';
import { api } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  users: {
    email: string;
    full_name: string | null;
  };
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 20px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 32,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-md)',
  padding: 20,
  marginBottom: 16,
};

const memberListStyle: React.CSSProperties = {
  marginTop: 16,
  borderTop: '1px solid var(--border-2)',
  paddingTop: 16,
};

const memberItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid var(--border-2)',
};

const roleSelectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border-2)',
  background: 'var(--bg-surface)',
  fontSize: 13,
};

export default function Teams() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('clinician');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    try {
      setLoading(true);
      const response = await api.get('/api/organizations');
      setOrganizations(response.data);
      if (response.data.length > 0) {
        selectOrganization(response.data[0]);
      }
    } catch (err) {
      setError('Failed to load organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectOrganization(org: Organization) {
    setSelectedOrg(org);
    try {
      const response = await api.get(`/api/organizations/${org.id}/members`);
      setMembers(response.data);
    } catch (err) {
      setError('Failed to load members');
      console.error(err);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg || !inviteEmail) return;

    try {
      setError('');
      const response = await api.post(`/api/organizations/${selectedOrg.id}/members/invite`, {
        email: inviteEmail,
        role: inviteRole,
      });

      setMembers([...members, response.data]);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite member');
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    if (!selectedOrg) return;

    try {
      const response = await api.put(`/api/organizations/${selectedOrg.id}/members/${memberId}`, {
        role: newRole,
      });

      setMembers(members.map(m => (m.id === memberId ? response.data : m)));
    } catch (err) {
      setError('Failed to update member role');
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedOrg || !window.confirm('Remove this member from the organization?')) return;

    try {
      await api.delete(`/api/organizations/${selectedOrg.id}/members/${memberId}`);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      setError('Failed to remove member');
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 className="t-h2">Teams & Organizations</h1>
        <Button onClick={() => navigate('/settings')}>
          <Icon name="settings" size={16} style={{ marginRight: 8 }} />
          Account Settings
        </Button>
      </div>

      {error && (
        <div style={{
          background: 'var(--error-100)',
          border: '1px solid var(--error-200)',
          borderRadius: 'var(--r-sm)',
          padding: 12,
          marginBottom: 24,
          color: 'var(--error-700)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Icon name="alert-circle" size={16} />
          {error}
        </div>
      )}

      {organizations.length === 0 ? (
        <div style={cardStyle}>
          <p className="t-body">No organizations yet. Create one to start collaborating with your team.</p>
        </div>
      ) : (
        <>
          {/* Organization Selector */}
          <div style={cardStyle}>
            <label htmlFor="org-select" className="t-label">Select Organization</label>
            <select
              id="org-select"
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const org = organizations.find(o => o.id === e.target.value);
                if (org) selectOrganization(org);
              }}
              style={{
                marginTop: 8,
                padding: '11px 12px',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border-2)',
                background: 'var(--bg-surface)',
                fontSize: 14,
                width: '100%',
              }}
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Team Details */}
          {selectedOrg && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 className="t-h4">{selectedOrg.name}</h2>
                  {selectedOrg.description && (
                    <p className="t-body" style={{ color: 'var(--fg-2)', marginTop: 4 }}>
                      {selectedOrg.description}
                    </p>
                  )}
                </div>
                <Button onClick={() => setShowInvite(!showInvite)} variant="primary" size="sm">
                  <Icon name="plus" size={16} style={{ marginRight: 4 }} />
                  Invite Member
                </Button>
              </div>

              {/* Invite Form */}
              {showInvite && (
                <form onSubmit={handleInvite} style={{
                  background: 'var(--bg-panel)',
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  marginBottom: 16,
                  border: '1px solid var(--border-2)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label htmlFor="invite-email" className="t-label" style={{ display: 'block', marginBottom: 6 }}>
                        Email Address
                      </label>
                      <input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@example.com"
                        required
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border-2)',
                          background: 'var(--bg-surface)',
                          fontSize: 14,
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="invite-role" className="t-label" style={{ display: 'block', marginBottom: 6 }}>
                        Role
                      </label>
                      <select
                        id="invite-role"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        style={roleSelectStyle}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="clinician">Clinician</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <Button type="submit" variant="primary" size="sm">Send Invite</Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowInvite(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Members List */}
              {members.length > 0 && (
                <div style={memberListStyle}>
                  <h3 className="t-h5" style={{ marginBottom: 12 }}>Team Members ({members.length})</h3>
                  {members.map(member => (
                    <div key={member.id} style={memberItemStyle}>
                      <div>
                        <div className="t-body" style={{ fontWeight: 500 }}>
                          {member.users.full_name || 'Unknown'}
                        </div>
                        <div className="t-caption" style={{ color: 'var(--fg-2)' }}>
                          {member.users.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          style={roleSelectStyle}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="clinician">Clinician</option>
                          <option value="admin">Admin</option>
                        </select>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--error-600)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: 14,
                            }}
                            title="Remove member"
                          >
                            <Icon name="trash-2" size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
