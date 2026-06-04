import { Avatar, Icon } from '@/components/ui';
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
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 10px 4px', marginTop: 6, borderTop: '1px solid var(--border-1)',
          }}>
            <Avatar initials="RK" size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dr. R. Kaur
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Radiologist</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
