import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddPatientDialog } from '../AddPatientDialog';
import * as usePatients from '@/hooks/usePatients';

vi.mock('@/hooks/usePatients', () => ({
  useCreatePatient: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'patient-1' }),
    isPending: false,
  })),
  GENDERS: ['Male', 'Female', 'Other'],
  CANCER_STAGES: ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown'],
  BIOMARKER_STATUSES: ['Positive', 'Negative', 'Unknown'],
}));

describe('AddPatientDialog', () => {
  const mockOnClose = vi.fn();

  it('should render form sections', () => {
    render(<AddPatientDialog onClose={mockOnClose} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis')).toBeInTheDocument();
    expect(screen.getByText('Biomarkers')).toBeInTheDocument();
    expect(screen.getByText('Treatment Plan')).toBeInTheDocument();
  });

  it('should have proper form field labels', () => {
    render(<AddPatientDialog onClose={mockOnClose} />);

    expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth *')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
    expect(screen.getByLabelText('Ethnicity')).toBeInTheDocument();
    expect(screen.getByLabelText('Diagnosis Date *')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancer Type *')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancer Stage')).toBeInTheDocument();
    expect(screen.getByLabelText('Tumor Size (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Lymph node positive')).toBeInTheDocument();
    expect(screen.getByLabelText('ER Status')).toBeInTheDocument();
    expect(screen.getByLabelText('PR Status')).toBeInTheDocument();
    expect(screen.getByLabelText('HER2 Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Menopausal Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Treatment Plan')).toBeInTheDocument();
  });

  it('should allow filling in form fields', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const fullNameInput = screen.getByLabelText('Full Name *') as HTMLInputElement;
    const dobInput = screen.getByLabelText('Date of Birth *') as HTMLInputElement;

    await user.type(fullNameInput, 'John Doe');
    await user.type(dobInput, '1980-01-15');

    expect(fullNameInput.value).toBe('John Doe');
    expect(dobInput.value).toBe('1980-01-15');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: /create patient/i });
    await user.click(submitButton);

    // Form should prevent submission with HTML5 validation
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle gender selection', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const genderSelect = screen.getByLabelText('Gender') as HTMLSelectElement;
    await user.selectOptions(genderSelect, 'Male');

    expect(genderSelect.value).toBe('Male');
  });

  it('should handle cancer stage selection', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const stageSelect = screen.getByLabelText('Cancer Stage') as HTMLSelectElement;
    await user.selectOptions(stageSelect, 'Stage II');

    expect(stageSelect.value).toBe('Stage II');
  });

  it('should handle biomarker selections', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const erSelect = screen.getByLabelText('ER Status') as HTMLSelectElement;
    const prSelect = screen.getByLabelText('PR Status') as HTMLSelectElement;
    const her2Select = screen.getByLabelText('HER2 Status') as HTMLSelectElement;

    await user.selectOptions(erSelect, 'Positive');
    await user.selectOptions(prSelect, 'Negative');
    await user.selectOptions(her2Select, 'Unknown');

    expect(erSelect.value).toBe('Positive');
    expect(prSelect.value).toBe('Negative');
    expect(her2Select.value).toBe('Unknown');
  });

  it('should handle checkbox for lymph node', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const checkbox = screen.getByLabelText('Lymph node positive') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('should handle numeric input for tumor size', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const tumorSizeInput = screen.getByLabelText('Tumor Size (cm)') as HTMLInputElement;
    await user.type(tumorSizeInput, '2.5');

    expect(tumorSizeInput.value).toBe('2.5');
  });

  it('should close dialog when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close dialog when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    const closeButtons = screen.getAllByRole('button').filter(btn => btn.className.includes('icon-btn'));
    await user.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display error message when submission fails', async () => {
    const mockError = new Error('Network error');
    vi.mocked(usePatients.useCreatePatient).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isPending: false,
    } as any);

    const user = userEvent.setup();
    render(<AddPatientDialog onClose={mockOnClose} />);

    // Fill required fields
    await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
    await user.type(screen.getByLabelText('Date of Birth *'), '1980-01-15');
    await user.type(screen.getByLabelText('Diagnosis Date *'), '2023-01-15');
    await user.type(screen.getByLabelText('Cancer Type *'), 'Breast');

    const submitButton = screen.getByRole('button', { name: /create patient/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error|failed to create/i)).toBeInTheDocument();
    });
  });
});
