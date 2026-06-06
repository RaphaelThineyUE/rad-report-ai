import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as apiModule from '@/lib/api';

vi.mock('@/lib/api');

const mockDashboardStats = {
  summary: {
    total_patients: 45,
    total_reports: 120,
    completed_reports: 110,
    failed_reports: 5,
    avg_processing_time_ms: 2500,
  },
};

const mockPatients = [
  {
    id: 'p1',
    full_name: 'Jane Doe',
    cancer_stage: 'Stage II',
    date_of_birth: '1975-05-15',
  },
  {
    id: 'p2',
    full_name: 'John Smith',
    cancer_stage: 'Stage III',
    date_of_birth: '1968-08-22',
  },
];

const mockTreatments = [
  {
    patient_id: 'p1',
    follow_up_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    treatment_type: 'Chemotherapy',
  },
  {
    patient_id: 'p2',
    follow_up_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    treatment_type: 'Surgery',
  },
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockApi = apiModule as any;
    mockApi.api = {
      get: vi.fn(),
    };
  });

  it('renders dashboard page header', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of your clinical practice')).toBeInTheDocument();
    });
  });

  it('displays stat cards with correct metrics', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // total patients
      expect(screen.getByText('120')).toBeInTheDocument(); // total reports
      expect(screen.getByText('110')).toBeInTheDocument(); // completed
    });
  });

  it('renders patient selector dropdown', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    render(<Dashboard />);

    await waitFor(() => {
      const select = screen.getByDisplayValue('Select a patient...');
      expect(select).toBeInTheDocument();
    });
  });

  it('displays patient options in dropdown', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe (Stage II)')).toBeInTheDocument();
      expect(screen.getByText('John Smith (Stage III)')).toBeInTheDocument();
    });
  });

  it('renders follow-up reminders section', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    for (const patient of mockPatients) {
      mockApi.api.get.mockResolvedValueOnce({
        data: mockTreatments.filter((t) => t.patient_id === patient.id),
      });
    }

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Follow-Up Due Reminders')).toBeInTheDocument();
    });
  });

  it('displays follow-up items with correct status', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    for (const patient of mockPatients) {
      mockApi.api.get.mockResolvedValueOnce({
        data: mockTreatments.filter((t) => t.patient_id === patient.id),
      });
    }

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<Dashboard />);

    expect(container.textContent).toContain('Loading...');
  });

  it('handles API errors gracefully', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      // Should still render the page without crashing
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows empty follow-up message when no follow-ups due', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    for (const patient of mockPatients) {
      mockApi.api.get.mockResolvedValueOnce({ data: [] });
    }

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No follow-ups due in the next 30 days')).toBeInTheDocument();
    });
  });

  it('displays quick stats section', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    });
  });

  it('displays patient selector section', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockResolvedValueOnce({ data: mockDashboardStats });
    mockApi.api.get.mockResolvedValueOnce({ data: mockPatients });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Patient Selector')).toBeInTheDocument();
    });
  });
});
