# Self-Service Sign-Up Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email/password + Google OAuth sign-up with email verification, and expose Google OAuth on the Login page.

**Architecture:** `AuthContext` gains a `signUp(email, password, fullName)` method. A shared `GoogleIcon` SVG component is extracted to `src/components/ui/`. A new `SignUp.tsx` page follows the existing two-column auth layout and transitions to a confirmation state after sign-up. `Login.tsx` is updated with Google OAuth and a sign-up link. A `/signup` route is added to `App.tsx`.

**Tech Stack:** React 18, TypeScript, Vitest + @testing-library/react (jsdom, setup at `src/test/setup.ts`), Supabase JS v2, react-router-dom v6

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `frontend/src/contexts/AuthContext.tsx` | Add `signUp` method and type |
| Modify | `frontend/src/contexts/__tests__/AuthContext.test.tsx` | Add `signUp` tests |
| Create | `frontend/src/components/ui/GoogleIcon.tsx` | Shared Google SVG icon |
| Modify | `frontend/src/components/ui/index.ts` | Export `GoogleIcon` |
| Modify | `frontend/src/pages/Login.tsx` | Google button, sign-up link, remove hardcoded email, add `htmlFor` labels |
| Create | `frontend/src/pages/__tests__/Login.test.tsx` | Login page unit tests |
| Create | `frontend/src/pages/SignUp.tsx` | Sign-up page with form + confirmation state |
| Create | `frontend/src/pages/__tests__/SignUp.test.tsx` | SignUp page unit tests |
| Modify | `frontend/src/App.tsx` | Register `/signup` route |

---

### Task 1: Add `signUp` to AuthContext

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`
- Modify: `frontend/src/contexts/__tests__/AuthContext.test.tsx`

- [ ] **Step 1: Add `signUp` to the supabase mock in the test file**

In `frontend/src/contexts/__tests__/AuthContext.test.tsx`, update the `vi.mock` block (the `auth` object):

```ts
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
```

- [ ] **Step 2: Append three failing tests inside the existing `describe('AuthContext')` block**

Add this nested `describe` block at the end of `describe('AuthContext')`, before the closing `}`; also add the `TestComponentWithGoogle` function if not already present (it's currently at the bottom of the file):

```ts
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
```

- [ ] **Step 3: Run tests to confirm the 3 new tests fail**

```bash
cd frontend && yarn test src/contexts/__tests__/AuthContext.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: existing tests pass, 3 new `signUp` tests fail with "signUp is not a function".

- [ ] **Step 4: Add `signUp` to `AuthContextType` and implement it**

In `frontend/src/contexts/AuthContext.tsx`, update the interface:

```ts
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
}
```

Add the implementation inside `AuthProvider`, alongside `logout` and `signInWithGoogle`:

```ts
const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
};
```

Update the provider `value` prop:

```tsx
<AuthContext.Provider value={{ user, session, isLoading, logout, signInWithGoogle, signUp }}>
```

- [ ] **Step 5: Run tests to confirm all pass**

```bash
cd frontend && yarn test src/contexts/__tests__/AuthContext.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx frontend/src/contexts/__tests__/AuthContext.test.tsx
git commit -m "$(cat <<'EOF'
feat: add signUp method to AuthContext

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create shared `GoogleIcon` and update Login page

**Files:**
- Create: `frontend/src/components/ui/GoogleIcon.tsx`
- Modify: `frontend/src/components/ui/index.ts`
- Modify: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/__tests__/Login.test.tsx`

- [ ] **Step 1: Write failing Login tests**

Create `frontend/src/pages/__tests__/Login.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '@/pages/Login';

const mockSignInWithGoogle = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signInWithGoogle: mockSignInWithGoogle }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: mockSignInWithPassword } },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

describe('Login page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders work email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('email field is empty by default', () => {
    renderLogin();
    expect(screen.getByLabelText(/work email/i)).toHaveValue('');
  });

  it('renders "Continue with Google" button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('renders sign-up link pointing to /signup', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });

  it('calls supabase.auth.signInWithPassword with entered email and password', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/work email/i), 'test@clinic.org');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in securely/i }));
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@clinic.org', password: 'password123' });
  });

  it('shows error message on failed sign-in', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid credentials' } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/work email/i), 'test@clinic.org');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in securely/i }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && yarn test src/pages/__tests__/Login.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: failures for "empty by default", "Continue with Google" button, "sign up" link.

- [ ] **Step 3: Create `GoogleIcon` component**

Create `frontend/src/components/ui/GoogleIcon.tsx`:

```tsx
export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="#4285F4" d="M15.68 8.18c0-.57-.05-1.11-.15-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.6 2.41v2h2.6c1.52-1.4 2.38-3.46 2.38-5.87Z"/>
      <path fill="#34A853" d="M8 16c2.16 0 3.97-.71 5.3-1.95l-2.6-2a4.77 4.77 0 0 1-7.1-2.5H.97v2.07A8 8 0 0 0 8 16Z"/>
      <path fill="#FBBC05" d="M3.6 9.55A4.8 4.8 0 0 1 3.6 6.45V4.38H.97a8 8 0 0 0 0 7.24l2.63-2.07Z"/>
      <path fill="#EA4335" d="M8 3.18c1.18 0 2.24.4 3.07 1.2l2.3-2.3A8 8 0 0 0 .97 4.38L3.6 6.45A4.77 4.77 0 0 1 8 3.18Z"/>
    </svg>
  );
}
```

- [ ] **Step 4: Export `GoogleIcon` from the UI index**

In `frontend/src/components/ui/index.ts`, add:

```ts
export { GoogleIcon } from './GoogleIcon';
```

- [ ] **Step 5: Replace `frontend/src/pages/Login.tsx` with the updated version**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, GoogleIcon } from '@/components/ui';
import logoLockup from '@/assets/logo-lockup.svg';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.session) {
        setError(signInError?.message || 'Failed to sign in');
        return;
      }
      navigate('/worklist');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Left: brand panel */}
      <div style={{
        flex: '1 1 46%', background: 'var(--grad-mesh), var(--bg-surface)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '44px 48px',
      }}>
        <img src={logoLockup} style={{ height: 36 }} alt="RadReport AI" />
        <div>
          <div className="t-overline" style={{ color: 'var(--rose-700)', marginBottom: 16 }}>
            Earlier detection · clearer decisions
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--fg-1)',
            margin: '0 0 18px', maxWidth: 460,
          }}>
            Every report, read with care.
          </h1>
          <p className="t-body-lg" style={{ maxWidth: 420, margin: 0 }}>
            Secure PDF upload, AI-driven extraction, and longitudinal patient management — built for breast imaging teams.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)', fontSize: 12.5 }}>
          <Icon name="shield" size={15} color="var(--success-700)" />
          HIPAA-aligned · SOC 2 Type II · end-to-end encrypted
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 40,
        borderLeft: '1px solid var(--border-1)',
      }}>
        <form onSubmit={handleSignIn} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <h2 className="t-h2" style={{ marginBottom: 6 }}>Sign in</h2>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 24 }}>
            Use your clinical workspace credentials.
          </p>

          {error && (
            <div style={{
              background: 'var(--error-100)', border: '1px solid var(--error-200)',
              borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 16,
              color: 'var(--error-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, gap: 10, marginBottom: 16, opacity: googleLoading ? 0.6 : 1 }}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-4)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
          </div>

          <label htmlFor="login-email" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Work email
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="mail" size={17} />
            </span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <label htmlFor="login-password" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="lock" size={17} />
            </span>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22 }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{ fontSize: 13, color: 'var(--fg-brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in securely'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--fg-3)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, color: 'var(--fg-4)', fontSize: 11.5 }}>
            <Icon name="shield" size={13} />
            Protected by single sign-on &amp; audit logging
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd frontend && yarn test src/pages/__tests__/Login.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: all 7 tests pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/GoogleIcon.tsx frontend/src/components/ui/index.ts \
        frontend/src/pages/Login.tsx frontend/src/pages/__tests__/Login.test.tsx
git commit -m "$(cat <<'EOF'
feat: add Google OAuth and sign-up link to Login page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create SignUp page

**Files:**
- Create: `frontend/src/pages/SignUp.tsx`
- Create: `frontend/src/pages/__tests__/SignUp.test.tsx`

- [ ] **Step 1: Write failing SignUp tests**

Create `frontend/src/pages/__tests__/SignUp.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '@/pages/SignUp';

const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signUp: mockSignUp, signInWithGoogle: mockSignInWithGoogle }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

function renderSignUp() {
  return render(<MemoryRouter><SignUp /></MemoryRouter>);
}

describe('SignUp page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders full name, work email, and password fields', () => {
    renderSignUp();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('renders "Continue with Google" button', () => {
    renderSignUp();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('renders sign-in link pointing to /login', () => {
    renderSignUp();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('calls signUp with email, password, and full name on submit', async () => {
    mockSignUp.mockResolvedValue(undefined);
    renderSignUp();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Alice Kaur');
    await userEvent.type(screen.getByLabelText(/work email/i), 'alice@clinic.org');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(mockSignUp).toHaveBeenCalledWith('alice@clinic.org', 'password123', 'Alice Kaur');
  });

  it('shows confirmation state after successful sign-up', async () => {
    mockSignUp.mockResolvedValue(undefined);
    renderSignUp();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Alice Kaur');
    await userEvent.type(screen.getByLabelText(/work email/i), 'alice@clinic.org');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText(/alice@clinic\.org/)).toBeInTheDocument();
  });

  it('shows error when signUp throws with a message', async () => {
    mockSignUp.mockRejectedValue({ message: 'User already registered' });
    renderSignUp();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Alice Kaur');
    await userEvent.type(screen.getByLabelText(/work email/i), 'alice@clinic.org');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('User already registered')).toBeInTheDocument();
  });

  it('shows generic error when signUp throws without a message', async () => {
    mockSignUp.mockRejectedValue({});
    renderSignUp();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Alice Kaur');
    await userEvent.type(screen.getByLabelText(/work email/i), 'alice@clinic.org');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);
    renderSignUp();
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd frontend && yarn test src/pages/__tests__/SignUp.test.tsx --reporter=verbose 2>&1 | tail -10
```

Expected: all 7 tests fail with "Failed to resolve import '@/pages/SignUp'".

- [ ] **Step 3: Create `frontend/src/pages/SignUp.tsx`**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, GoogleIcon } from '@/components/ui';
import logoLockup from '@/assets/logo-lockup.svg';
import { useAuth } from '@/contexts/AuthContext';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
  background: 'var(--bg-surface)', border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '11px 12px 11px 38px',
  boxShadow: 'var(--shadow-xs)', outline: 'none', boxSizing: 'border-box',
};

const BrandPanel = (
  <div style={{
    flex: '1 1 46%', background: 'var(--grad-mesh), var(--bg-surface)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '44px 48px',
  }}>
    <img src={logoLockup} style={{ height: 36 }} alt="RadReport AI" />
    <div>
      <div className="t-overline" style={{ color: 'var(--rose-700)', marginBottom: 16 }}>
        Earlier detection · clearer decisions
      </div>
      <h1 style={{
        fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 600,
        letterSpacing: '-0.02em', lineHeight: 1.05, color: 'var(--fg-1)',
        margin: '0 0 18px', maxWidth: 460,
      }}>
        Every report, read with care.
      </h1>
      <p className="t-body-lg" style={{ maxWidth: 420, margin: 0 }}>
        Secure PDF upload, AI-driven extraction, and longitudinal patient management — built for breast imaging teams.
      </p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)', fontSize: 12.5 }}>
      <Icon name="shield" size={15} color="var(--success-700)" />
      HIPAA-aligned · SOC 2 Type II · end-to-end encrypted
    </div>
  </div>
);

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ height: '100vh', display: 'flex' }}>
        {BrandPanel}
        <div style={{
          flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 40,
          borderLeft: '1px solid var(--border-1)',
        }}>
          <div style={{ width: '100%', maxWidth: 360 }} className="fade-up">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--success-100)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Icon name="check" size={28} color="var(--success-700)" />
              </div>
              <h2 className="t-h2" style={{ marginBottom: 6 }}>Check your email</h2>
              <p className="t-body" style={{ margin: 0, color: 'var(--fg-3)' }}>
                We've sent a confirmation link to <strong>{email}</strong>.
                Click it to activate your account, then sign in.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 12 }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {BrandPanel}
      <div style={{
        flex: '1 1 54%', background: 'var(--bg-surface)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 40,
        borderLeft: '1px solid var(--border-1)',
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }} className="fade-up">
          <h2 className="t-h2" style={{ marginBottom: 6 }}>Create account</h2>
          <p className="t-body" style={{ marginTop: 0, marginBottom: 24 }}>
            Join your clinical workspace.
          </p>

          {error && (
            <div style={{
              background: 'var(--error-100)', border: '1px solid var(--error-200)',
              borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 16,
              color: 'var(--error-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, gap: 10, marginBottom: 16, opacity: googleLoading ? 0.6 : 1 }}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-4)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
          </div>

          <label htmlFor="signup-name" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Full name
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="user" size={17} />
            </span>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <label htmlFor="signup-email" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Work email
          </label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="mail" size={17} />
            </span>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={INPUT_STYLE}
            />
          </div>

          <label htmlFor="signup-password" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-4)' }}>
              <Icon name="lock" size={17} />
            </span>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              style={INPUT_STYLE}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--fg-3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--fg-brand)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd frontend && yarn test src/pages/__tests__/SignUp.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SignUp.tsx frontend/src/pages/__tests__/SignUp.test.tsx
git commit -m "$(cat <<'EOF'
feat: add SignUp page with email/password and Google OAuth

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Register `/signup` route and run full test suite

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add the import and route**

In `frontend/src/App.tsx`, add the import after the `ResetPassword` import:

```ts
import SignUp from '@/pages/SignUp';
```

In the public routes block, add the `/signup` route after `/login`:

```tsx
<Routes>
  <Route path="/login"           element={<Login />} />
  <Route path="/signup"          element={<SignUp />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password"  element={<ResetPassword />} />
  <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
</Routes>
```

- [ ] **Step 2: Run the full test suite**

```bash
cd frontend && yarn test --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass across AuthContext, Login, SignUp, ProtectedRoute, and sentry test files.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat: register /signup route in App

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
