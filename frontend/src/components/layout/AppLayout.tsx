import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UploadDrawer } from '@/components/drawers/UploadDrawer';

type NavId = 'worklist' | 'patients' | 'analytics' | 'settings';

interface AppLayoutProps {
  active: NavId;
  onNav: (id: NavId) => void;
  search: string;
  setSearch: (v: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ active, onNav, search, setSearch, children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar active={active} onNav={onNav} collapsed={collapsed} />
      <div className="main">
        <Topbar
          onToggleSidebar={() => setCollapsed(c => !c)}
          onUpload={() => setUploadOpen(true)}
          search={search}
          setSearch={setSearch}
        />
        <div className="content">{children}</div>
      </div>
      {uploadOpen && (
        <UploadDrawer
          onClose={() => setUploadOpen(false)}
          onComplete={() => setUploadOpen(false)}
        />
      )}
    </div>
  );
}
