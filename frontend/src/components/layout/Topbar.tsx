import { Icon, Button } from '@/components/ui';

interface TopbarProps {
  onToggleSidebar: () => void;
  onUpload: () => void;
  search: string;
  setSearch: (v: string) => void;
}

export function Topbar({ onToggleSidebar, onUpload, search, setSearch }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleSidebar} title="Toggle sidebar" style={{ border: 'none', background: 'transparent' }}>
        <Icon name="panel-left" size={20} />
      </button>
      <div className="search">
        <Icon name="search" size={17} />
        <input
          placeholder="Search patients, accessions, findings…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div style={{ flex: 1 }} />
      <Button icon="upload" onClick={onUpload}>Upload report</Button>
      <button className="icon-btn" title="Notifications">
        <Icon name="bell" size={19} />
        <span className="dot-badge" />
      </button>
      <button className="icon-btn" title="Compliance" style={{ color: 'var(--success-700)' }}>
        <Icon name="shield" size={19} />
      </button>
    </header>
  );
}
