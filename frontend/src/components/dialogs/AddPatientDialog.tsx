import { useState } from 'react';
import { useCreatePatient, GENDERS, CANCER_STAGES, BIOMARKER_STATUSES } from '@/hooks/usePatients';
import { Button, Icon } from '@/components/ui';

interface AddPatientDialogProps {
  onClose: () => void;
}

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
    try {
      await createPatient.mutateAsync({
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        ethnicity: formData.ethnicity || undefined,
        diagnosis_date: formData.diagnosis_date,
        cancer_type: formData.cancer_type,
        cancer_stage: formData.cancer_stage,
        tumor_size_cm: formData.tumor_size_cm ? parseFloat(formData.tumor_size_cm) : undefined,
        lymph_node_positive: formData.lymph_node_positive,
        er_status: formData.er_status,
        pr_status: formData.pr_status,
        her2_status: formData.her2_status,
        menopausal_status: formData.menopausal_status || undefined,
        initial_treatment_plan: formData.initial_treatment_plan || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create patient:', error);
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="t-label">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  required
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label className="t-label">Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="input"
                  required
                  style={{ marginTop: 6 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="t-label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className="input"
                  style={{ marginTop: 6 }}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="t-label">Ethnicity</label>
                <input
                  type="text"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleChange}
                  className="input"
                  style={{ marginTop: 6 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="t-label">Diagnosis Date *</label>
                <input
                  type="date"
                  name="diagnosis_date"
                  value={formData.diagnosis_date}
                  onChange={handleChange}
                  className="input"
                  required
                  style={{ marginTop: 6 }}
                />
              </div>
              <div>
                <label className="t-label">Cancer Type *</label>
                <input
                  type="text"
                  name="cancer_type"
                  value={formData.cancer_type}
                  onChange={handleChange}
                  className="input"
                  required
                  style={{ marginTop: 6 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="t-label">Cancer Stage</label>
                <select
                  name="cancer_stage"
                  value={formData.cancer_stage || ''}
                  onChange={handleChange}
                  className="input"
                  style={{ marginTop: 6 }}
                >
                  <option value="">Select stage</option>
                  {CANCER_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="t-label">Tumor Size (cm)</label>
                <input
                  type="number"
                  name="tumor_size_cm"
                  value={formData.tumor_size_cm}
                  onChange={handleChange}
                  className="input"
                  step="0.1"
                  min="0"
                  style={{ marginTop: 6 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="t-label">ER Status</label>
                <select
                  name="er_status"
                  value={formData.er_status || ''}
                  onChange={handleChange}
                  className="input"
                  style={{ marginTop: 6 }}
                >
                  <option value="">Select</option>
                  {BIOMARKER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="t-label">PR Status</label>
                <select
                  name="pr_status"
                  value={formData.pr_status || ''}
                  onChange={handleChange}
                  className="input"
                  style={{ marginTop: 6 }}
                >
                  <option value="">Select</option>
                  {BIOMARKER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="t-label">HER2 Status</label>
                <select
                  name="her2_status"
                  value={formData.her2_status || ''}
                  onChange={handleChange}
                  className="input"
                  style={{ marginTop: 6 }}
                >
                  <option value="">Select</option>
                  {BIOMARKER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="t-label">Menopausal Status</label>
              <input
                type="text"
                name="menopausal_status"
                value={formData.menopausal_status}
                onChange={handleChange}
                className="input"
                style={{ marginTop: 6 }}
              />
            </div>

            <div>
              <label className="t-label">Initial Treatment Plan</label>
              <textarea
                name="initial_treatment_plan"
                value={formData.initial_treatment_plan}
                onChange={handleChange}
                className="input"
                rows={4}
                style={{ marginTop: 6 }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
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
