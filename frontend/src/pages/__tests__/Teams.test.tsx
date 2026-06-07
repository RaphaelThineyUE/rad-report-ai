import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Teams from '../Teams';
import * as api from '@/lib/api';

vi.mock('@/lib/api');

const mockOrganizations = [
  {
    id: 'org-1',
    name: 'Test Organization',
    description: 'A test org',
    owner_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockMembers = [
  {
    id: 'member-1',
    user_id: 'user-1',
    role: 'owner',
    created_at: '2024-01-01T00:00:00Z',
    users: {
      email: 'owner@example.com',
      full_name: 'Owner User',
    },
  },
  {
    id: 'member-2',
    user_id: 'user-2',
    role: 'clinician',
    created_at: '2024-01-02T00:00:00Z',
    users: {
      email: 'clinician@example.com',
      full_name: 'Clinician User',
    },
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Teams Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.api.get).mockImplementation((url: string) => {
      if (url === '/api/organizations') {
        return Promise.resolve({ data: mockOrganizations });
      }
      if (url.includes('/members')) {
        return Promise.resolve({ data: mockMembers });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('should load and display organizations', async () => {
    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getAllByText('Test Organization')[0]).toBeInTheDocument();
    });
  });

  it('should load members when org is selected', async () => {
    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getByText('Owner User')).toBeInTheDocument();
      expect(screen.getByText('Clinician User')).toBeInTheDocument();
    });
  });

  it('should display member details correctly', async () => {
    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      expect(screen.getByText('clinician@example.com')).toBeInTheDocument();
    });
  });

  it('should allow toggling invite form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getAllByText('Test Organization')[0]).toBeInTheDocument();
    });

    const inviteButton = screen.getByRole('button', { name: /invite member/i });
    await user.click(inviteButton);

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('should invite a new member', async () => {
    const user = userEvent.setup();
    const mockNewMember = {
      id: 'member-3',
      user_id: 'user-3',
      role: 'clinician',
      users: {
        email: 'newuser@example.com',
        full_name: 'New User',
      },
    };

    vi.mocked(api.api.post).mockResolvedValue({ data: mockNewMember });

    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getAllByText('Test Organization')[0]).toBeInTheDocument();
    });

    const inviteButton = screen.getByRole('button', { name: /invite member/i });
    await user.click(inviteButton);

    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;

    await user.type(emailInput, 'newuser@example.com');
    await user.selectOptions(roleSelect, 'clinician');

    const sendButton = screen.getByRole('button', { name: /send invite/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(api.api.post).toHaveBeenCalledWith(
        expect.stringContaining('/members/invite'),
        { email: 'newuser@example.com', role: 'clinician' }
      );
    });
  });

  it('should update member role', async () => {
    const user = userEvent.setup();
    vi.mocked(api.api.put).mockResolvedValue({
      data: { ...mockMembers[1], role: 'admin' },
    });

    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getByText('Clinician User')).toBeInTheDocument();
    });

    const roleSelects = screen.getAllByRole('option');
    const clinicianRoleSelect = screen.getAllByDisplayValue('Clinician')[0] as HTMLSelectElement;

    await user.selectOptions(clinicianRoleSelect.closest('select')!, 'admin');

    await waitFor(() => {
      expect(api.api.put).toHaveBeenCalled();
    });
  });

  it('should handle invitation errors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.api.post).mockRejectedValue({
      response: { data: { error: 'User already a member' } },
    });

    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getAllByText('Test Organization')[0]).toBeInTheDocument();
    });

    const inviteButton = screen.getByRole('button', { name: /invite member/i });
    await user.click(inviteButton);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'existing@example.com');

    const sendButton = screen.getByRole('button', { name: /send invite/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('User already a member')).toBeInTheDocument();
    });
  });

  it('should display organization description', async () => {
    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getByText('A test org')).toBeInTheDocument();
    });
  });

  it('should display team members count', async () => {
    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getByText('Team Members (2)')).toBeInTheDocument();
    });
  });

  it('should handle member removal confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    vi.mocked(api.api.delete).mockResolvedValue({ data: { success: true } });

    renderWithRouter(<Teams />);

    await waitFor(() => {
      expect(screen.getByText('Clinician User')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle('Remove member');
    await user.click(removeButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(api.api.delete).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
