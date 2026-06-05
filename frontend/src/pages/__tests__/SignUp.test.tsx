import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '@/pages/SignUp';

const { mockSignUp, mockSignInWithGoogle } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
}));

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
