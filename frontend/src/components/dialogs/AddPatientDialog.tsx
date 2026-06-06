import { useState } from 'react';
import { useCreatePatient, GENDERS, CANCER_STAGES, BIOMARKER_STATUSES } from '@/hooks/usePatients';
import { Button, Icon } from '@/components/ui';
import type { AxiosError } from 'axios';

interface AddPatientDialogProps {
  onClose: () => void;
}

const formSectionStyle: React.CSSProperties = {
  paddingBottom: 24,
  borderBottom: '1px solid var(--border-2)',
};

const formFieldStyle: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--fg-1)',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)',
  padding: '11px 12px',
  boxShadow: 'var(--shadow-xs)',
  outline: 'none',
  boxSizing: 'border-box',
};

const gridTwoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const gridThreeColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
};

export function AddPatientDialog({ onClose }: AddPatientDialogProps) {
  const createPatient = useCreatePatient();
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: null as string | null,
    ethnicity: '',
    diagnosis_date: '',
    cancer_type: '',
    cancer_stage: null as string | null,
    tumor_size_cm: '',
    lymph_node_positive: null as boolean | null,
    er_status: null as string | null,
    pr_status: null as string | null,
    her2_status: null as string | null,
    menopausal_status: '',
    initial_treatment_plan: '',
  });
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked ? true : false }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value || null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await createPatient.mutateAsync({
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender as 'Male' | 'Female' | 'Other' | null,
        ethnicity: formData.ethnicity || undefined,
        diagnosis_date: formData.diagnosis_date,
        cancer_type: formData.cancer_type,
        cancer_stage: formData.cancer_stage as 'Stage 0' | 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV' | 'Unknown' | null,
        tumor_size_cm: formData.tumor_size_cm ? parseFloat(formData.tumor_size_cm) : undefined,
        lymph_node_positive: formData.lymph_node_positive,
        er_status: formData.er_status as 'Unknown' | 'Positive' | 'Negative' | null,
        pr_status: formData.pr_status as 'Unknown' | 'Positive' | 'Negative' | null,
        her2_status: formData.her2_status as 'Unknown' | 'Positive' | 'Negative' | null,
        menopausal_status: formData.menopausal_status || undefined,
        initial_treatment_plan: formData.initial_treatment_plan || undefined,
      });
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string; errors?: Array<{ msg: string }> }>;
      const detail = axiosErr.response?.data?.error
        ?? axiosErr.response?.data?.errors?.map(e => e.msg).join(', ')
        ?? axiosErr.message
        ?? 'Failed to create patient';
      setSubmitError(detail);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-label="Add patient">
        <div className="modal-head">
          <h2 className="t-h3" style={{ margin: 0 }}>Add Patient</h2>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none' }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitError && (
              <div style={{
                background: 'var(--error-100)', border: '1px solid var(--error-200)',
                borderRadius: 'var(--r-sm)', padding: 12, marginBottom: 24,
                color: 'var(--error-700)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="alert-circle" size={16} />
                {submitError}
              </div>
            )}

            {/* Basic Information Section */}
            <div style={formSectionStyle}>
              <h3 className="t-h5" style={{ marginBottom: 16, color: 'var(--fg-1)' }}>Basic Information</h3>
              <div style={gridTwoColStyle}>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-full-name" className="t-label" style={labelStyle}>Full Name *</label>
                  <input
                    id="ap-full-name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-dob" className="t-label" style={labelStyle}>Date of Birth *</label>
                  <input
                    id="ap-dob"
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={gridTwoColStyle}>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-gender" className="t-label" style={labelStyle}>Gender</label>
                  <select
                    id="ap-gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-ethnicity" className="t-label" style={labelStyle}>Ethnicity</label>
                  <input
                    id="ap-ethnicity"
                    type="text"
                    name="ethnicity"
                    value={formData.ethnicity}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis Section */}
            <div style={formSectionStyle}>
              <h3 className="t-h5" style={{ marginBottom: 16, color: 'var(--fg-1)' }}>Diagnosis</h3>
              <div style={gridTwoColStyle}>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-diagnosis-date" className="t-label" style={labelStyle}>Diagnosis Date *</label>
                  <input
                    id="ap-diagnosis-date"
                    type="date"
                    name="diagnosis_date"
                    value={formData.diagnosis_date}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-cancer-type" className="t-label" style={labelStyle}>Cancer Type *</label>
                  <input
                    id="ap-cancer-type"
                    type="text"
                    name="cancer_type"
                    value={formData.cancer_type}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                    placeholder="e.g., Breast, Lung"
                  />
                </div>
              </div>

              <div style={gridTwoColStyle}>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-cancer-stage" className="t-label" style={labelStyle}>Cancer Stage</label>
                  <select
                    id="ap-cancer-stage"
                    name="cancer_stage"
                    value={formData.cancer_stage || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Select stage</option>
                    {CANCER_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-tumor-size" className="t-label" style={labelStyle}>Tumor Size (cm)</label>
                  <input
                    id="ap-tumor-size"
                    type="number"
                    name="tumor_size_cm"
                    value={formData.tumor_size_cm}
                    onChange={handleChange}
                    style={inputStyle}
                    step="0.1"
                    min="0"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div style={formFieldStyle}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    name="lymph_node_positive"
                    checked={formData.lymph_node_positive === true}
                    onChange={handleChange}
                  />
                  <span className="t-body">Lymph node positive</span>
                </label>
              </div>
            </div>

            {/* Biomarkers Section */}
            <div style={formSectionStyle}>
              <h3 className="t-h5" style={{ marginBottom: 16, color: 'var(--fg-1)' }}>Biomarkers</h3>
              <div style={gridThreeColStyle}>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-er-status" className="t-label" style={labelStyle}>ER Status</label>
                  <select
                    id="ap-er-status"
                    name="er_status"
                    value={formData.er_status || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {BIOMARKER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-pr-status" className="t-label" style={labelStyle}>PR Status</label>
                  <select
                    id="ap-pr-status"
                    name="pr_status"
                    value={formData.pr_status || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {BIOMARKER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div style={formFieldStyle}>
                  <label htmlFor="ap-her2-status" className="t-label" style={labelStyle}>HER2 Status</label>
                  <select
                    id="ap-her2-status"
                    name="her2_status"
                    value={formData.her2_status || ''}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {BIOMARKER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={formFieldStyle}>
                <label htmlFor="ap-menopausal" className="t-label" style={labelStyle}>Menopausal Status</label>
                <input
                  id="ap-menopausal"
                  type="text"
                  name="menopausal_status"
                  value={formData.menopausal_status}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Treatment Section */}
            <div>
              <h3 className="t-h5" style={{ marginBottom: 16, color: 'var(--fg-1)' }}>Treatment Plan</h3>
              <div style={formFieldStyle}>
                <label htmlFor="ap-treatment" className="t-label" style={labelStyle}>Initial Treatment Plan</label>
                <textarea
                  id="ap-treatment"
                  name="initial_treatment_plan"
                  value={formData.initial_treatment_plan}
                  onChange={handleChange}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  rows={4}
                  placeholder="Optional treatment details"
                />
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createPatient.isPending}>
              {createPatient.isPending ? 'Creating...' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
