import { Moon, Sun } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  ['/', 'Home'],
  ['/patients', 'Patients'],
  ['/analytics', 'Analytics'],
  ['/how-to', 'How To'],
] as const;

export const LayoutPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm text-primary">RadReport AI</p>
            <h1 className="text-lg font-semibold">Breast radiology consolidation</h1>
          </div>
          <nav className="hidden gap-2 md:flex">
            {navItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary text-white' : 'text-foreground/60'}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button className="bg-transparent text-foreground" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-lg border border-border/50 px-3 py-2 text-sm">
                {user?.full_name ?? user?.email ?? 'User'}
              </summary>
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-card p-2 shadow-sm">
                <p className="px-3 py-2 text-xs text-foreground/60">{user?.email}</p>
                <Button className="w-full bg-transparent text-foreground" onClick={signOut}>Log out</Button>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
