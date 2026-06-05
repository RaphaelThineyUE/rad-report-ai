import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import logoLockup from '@/assets/logo-lockup.svg';
import logomark from '@/assets/logomark.svg';

type NavId = 'worklist' | 'patients' | 'analytics' | 'settings';

interface SidebarProps {
  active: NavId;
  onNav: (id: NavId) => void;
  collapsed: boolean;
}

const NAV_ITEMS: { id: NavId; label: string; icon: string }[] = [
  { id: 'worklist',  label: 'Worklist',  icon: 'file-text' },
  { id: 'patients',  label: 'Patients',  icon: 'users' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
];

export function Sidebar({ active, onNav, collapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userInitials = user?.email?.charAt(0).toUpperCase() ?? 'U';
  const userDisplayName = user?.user_metadata?.full_name ?? user?.email ?? 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="side-logo">
        {collapsed
          ? <img src={logomark} style={{ height: 30, width: 30 }} alt="RadReport AI" />
          : <img src={logoLockup} alt="RadReport AI" />}
      </div>
      <nav className="nav">
        {NAV_ITEMS.map(it => (
          <button
            key={it.id}
            className={`nav-item${active === it.id ? ' active' : ''}`}
            onClick={() => onNav(it.id)}
          >
            <Icon name={it.icon} size={19} />
            {!collapsed && <span className="nav-label">{it.label}</span>}
          </button>
        ))}
      </nav>
      <div className="side-foot nav">
        <button
          className={`nav-item${active === 'settings' ? ' active' : ''}`}
          onClick={() => onNav('settings')}
        >
          <Icon name="settings" size={19} />
          {!collapsed && <span className="nav-label">Settings</span>}
        </button>
        {!collapsed && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 10px 4px', marginTop: 6, borderTop: '1px solid var(--border-1)',
                width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <Avatar initials={userInitials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userDisplayName.split(' ')[0]}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Radiologist</div>
              </div>
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0,
                background: 'var(--bg-surface)', border: '1px solid var(--border-1)',
                borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow-lg)',
                zIndex: 1000, marginBottom: 8, overflow: 'hidden',
              }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNav('settings');
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', textAlign: 'left', fontSize: 13,
                    color: 'var(--fg-1)', background: 'transparent', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Icon name="settings" size={16} />
                  Settings
                </button>
                <div style={{ borderTop: '1px solid var(--border-1)' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '10px 12px', textAlign: 'left', fontSize: 13,
                    color: 'var(--error-700)', background: 'transparent', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Icon name="log-out" size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
