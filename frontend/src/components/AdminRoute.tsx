/**
 * Route guard for admin-only pages. Checks if user has admin role,
 * renders children if admin, otherwise shows unauthorized message.
 */
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--fg-3)',
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="fade-up">
        <div className="page-head">
          <h1 className="t-h1">Access Denied</h1>
          <div className="sub">This page is only available to administrators</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
