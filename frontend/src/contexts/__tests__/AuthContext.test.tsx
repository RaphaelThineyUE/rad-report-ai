import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as supabaseModule from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
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

  it('should call signInWithOAuth with google provider', async () => {
    vi.stubGlobal('location', { origin: 'https://example.com' });
    const mockAuth = supabaseModule.supabase.auth as any;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mockAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    render(
      <AuthProvider>
        <TestComponentWithGoogle />
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://example.com/worklist' },
    });
  });

  it('should expose signInWithGoogle as a function on context', async () => {
    const mockAuth = supabaseModule.supabase.auth as any;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    let capturedFn: unknown;
    function Capture() {
      const ctx = useAuth();
      capturedFn = ctx.signInWithGoogle;
      return null;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(typeof capturedFn).toBe('function'));
  });

  describe('signUp', () => {
    function setupMocks() {
      const mockAuth = supabaseModule.supabase.auth as any;
      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      mockAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });
      return mockAuth;
    }

    function TestSignUpButton() {
      const { signUp } = useAuth();
      return (
        <button onClick={() => signUp('a@b.com', 'pass12345', 'Alice')}>
          Sign Up
        </button>
      );
    }

    it('exposes signUp as a function on context', async () => {
      const mockAuth = setupMocks();
      mockAuth.signUp.mockResolvedValue({ data: {}, error: null });

      let capturedFn: unknown;
      function Capture() {
        const ctx = useAuth();
        capturedFn = ctx.signUp;
        return null;
      }
      render(<AuthProvider><Capture /></AuthProvider>);
      await waitFor(() => expect(typeof capturedFn).toBe('function'));
    });

    it('calls supabase.auth.signUp with email, password, and full_name metadata', async () => {
      const mockAuth = setupMocks();
      mockAuth.signUp.mockResolvedValue({ data: {}, error: null });

      render(<AuthProvider><TestSignUpButton /></AuthProvider>);
      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'pass12345',
        options: { data: { full_name: 'Alice' } },
      });
    });

    it('throws when supabase.auth.signUp returns an error', async () => {
      const mockAuth = setupMocks();
      mockAuth.signUp.mockResolvedValue({
        data: {},
        error: { message: 'User already registered' },
      });

      let caughtError: unknown;
      function TestSignUpCatch() {
        const { signUp } = useAuth();
        return (
          <button onClick={async () => {
            try { await signUp('a@b.com', 'pass12345', 'Alice'); }
            catch (e) { caughtError = e; }
          }}>
            Sign Up
          </button>
        );
      }
      render(<AuthProvider><TestSignUpCatch /></AuthProvider>);
      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      await waitFor(() => expect(caughtError).toBeTruthy());
    });
  });
});

function TestComponentWithGoogle() {
  const { signInWithGoogle } = useAuth();
  return (
    <button onClick={() => signInWithGoogle()}>Sign in with Google</button>
  );
}
