import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as supabaseModule from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

function TestComponent() {
  const { user, session, isLoading } = useAuth();
  return (
    <div>
      {isLoading && <div>Loading</div>}
      {user && <div>User: {user.email}</div>}
      {session && <div>Session exists</div>}
      {!user && !isLoading && <div>Not authenticated</div>}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const mockAuth = supabaseModule.supabase.auth as any;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should load user session on mount', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token' };
    const mockAuth = supabaseModule.supabase.auth as any;

    mockAuth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/User: test@example.com/)).toBeInTheDocument();
      expect(screen.getByText('Session exists')).toBeInTheDocument();
    });
  });

  it('should handle no session', async () => {
    const mockAuth = supabaseModule.supabase.auth as any;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleError.mockRestore();
  });
});
