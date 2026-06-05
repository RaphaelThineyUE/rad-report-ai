import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '@/pages/Login';

const { mockSignInWithGoogle, mockSignInWithPassword } = vi.hoisted(() => ({
  mockSignInWithGoogle: vi.fn(),
  mockSignInWithPassword: vi.fn(),
}));

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
