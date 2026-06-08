import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PatientAnalytics from '../PatientAnalytics';
import * as apiModule from '@/lib/api';

vi.mock('@/lib/api');

const mockPatients = [
  {
    id: 'p1',
    full_name: 'Jane Doe',
    cancer_stage: 'Stage II',
    cancer_type: 'Invasive Ductal Carcinoma',
    date_of_birth: '1975-05-15',
    gender: 'Female',
    ethnicity: 'Caucasian',
  },
  {
    id: 'p2',
    full_name: 'John Smith',
    cancer_stage: 'Stage III',
    cancer_type: 'Invasive Lobular Carcinoma',
    date_of_birth: '1968-08-22',
    gender: 'Male',
    ethnicity: 'African American',
  },
];

const mockReports = [
  {
    id: 'r1',
    patient_id: 'p1',
    birads_value: 4,
    exam_type: 'Mammography',
    breast_density_value: 'Dense',
  },
  {
    id: 'r2',
    patient_id: 'p2',
    birads_value: 5,
    exam_type: 'MRI',
    breast_density_value: 'Fatty',
  },
];

const mockTreatments = [
  {
    id: 't1',
    patient_id: 'p1',
    treatment_type: 'Chemotherapy',
    treatment_outcome: 'Complete Response',
    treatment_start_date: '2024-01-01',
    treatment_end_date: '2024-04-01',
  },
  {
    id: 't2',
    patient_id: 'p2',
    treatment_type: 'Surgery',
    treatment_outcome: 'Partial Response',
    treatment_start_date: '2024-02-01',
    treatment_end_date: '2024-03-01',
  },
];

describe('PatientAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockApi = apiModule as any;
    mockApi.api = {
      get: vi.fn(),
    };
  });

  it('renders page header with correct title', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Patient Analytics')).toBeInTheDocument();
      expect(screen.getByText('Demographics, diagnostics, and treatment analysis')).toBeInTheDocument();
    });
  });

  it('displays stage filter dropdown', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('All Stages');
      expect(filterSelect).toBeInTheDocument();
    });
  });

  it('displays demographics section', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Patient Demographics')).toBeInTheDocument();
    });
  });

  it('displays gender distribution chart', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Gender Distribution')).toBeInTheDocument();
      expect(screen.getByText('Female')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
    });
  });

  it('displays cancer type distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Cancer Type Distribution')).toBeInTheDocument();
    });
  });

  it('displays cancer stage distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Cancer Stage Distribution')).toBeInTheDocument();
    });
  });

  it('displays key demographic metrics', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Total Patients')).toBeInTheDocument();
      expect(screen.getByText('Average Age')).toBeInTheDocument();
    });
  });

  it('displays diagnostics section', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Diagnostic Findings')).toBeInTheDocument();
    });
  });

  it('displays BI-RADS distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('BI-RADS Distribution')).toBeInTheDocument();
    });
  });

  it('displays exam type distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Exam Type Distribution')).toBeInTheDocument();
    });
  });

  it('displays breast density distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Breast Density Distribution')).toBeInTheDocument();
    });
  });

  it('displays treatment analysis section', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Treatment Analysis')).toBeInTheDocument();
    });
  });

  it('displays treatment type distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Treatment Type Distribution')).toBeInTheDocument();
    });
  });

  it('displays treatment outcome distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Treatment Outcome Distribution')).toBeInTheDocument();
    });
  });

  it('displays ethnicity distribution', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Ethnicity Distribution')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<PatientAnalytics />);

    expect(container.textContent).toContain('Loading...');
  });

  it('handles API errors gracefully', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get.mockRejectedValue(new Error('API Error'));

    render(<PatientAnalytics />);

    await waitFor(() => {
      // Should still render the page without crashing
      expect(screen.getByText('Patient Analytics')).toBeInTheDocument();
    });
  });

  it('displays treatment metrics', async () => {
    const mockApi = apiModule as any;
    mockApi.api.get
      .mockResolvedValueOnce({ data: mockPatients })
      .mockResolvedValueOnce({ data: mockReports })
      .mockResolvedValueOnce({ data: mockTreatments });

    render(<PatientAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Treatment Metrics')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
    });
  });
});
