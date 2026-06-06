import { useState, createContext, useContext, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BatchUploadDrawer } from '@/components/drawers/BatchUploadDrawer';

type NavId = 'worklist' | 'patients' | 'analytics' | 'admin-dashboard' | 'admin-users' | 'teams' | 'settings';

interface AppLayoutContextType {
  setCurrentPatientId: (id: string | null) => void;
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;
}

export const AppLayoutContext = createContext<AppLayoutContextType | null>(null);

export function useAppLayoutContext() {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error('useAppLayoutContext must be used within AppLayout');
  }
  return context;
}

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
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);

  // Auto-collapse sidebar on resize to smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AppLayoutContext.Provider value={{ setCurrentPatientId, uploadOpen, setUploadOpen }}>
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
        {uploadOpen && currentPatientId && (
          <BatchUploadDrawer
            patientId={currentPatientId}
            onClose={() => setUploadOpen(false)}
            onComplete={() => setUploadOpen(false)}
          />
        )}
      </div>
    </AppLayoutContext.Provider>
  );
}
