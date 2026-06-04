import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useUpdatePatient, type Patient, type CreatePatientInput } from '@/hooks/usePatients';

interface EditPatientDialogProps {
  patient: Patient;
  onClose: () => void;
}

const STAGES = ['Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown'];

export function EditPatientDialog({ patient, onClose }: EditPatientDialogProps) {
  const [form, setForm] = useState<CreatePatientInput>({
    name: patient.name,
    date_of_birth: patient.date_of_birth ?? '',
    sex: patient.sex ?? undefined,
    mrn: patient.mrn ?? '',
    stage: patient.stage ?? '',
    notes: patient.notes ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const mutation = useUpdatePatient();

  function set(key: keyof CreatePatientInput, value: string) {
    setForm(f => ({ ...f, [key]: value || undefined }));
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name?.trim()) errors.name = 'Name is required';
    else if (form.name.trim().length > 200) errors.name = 'Name must be at most 200 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await mutation.mutateAsync({
        id: patient.id,
        name: form.name!.trim(),
        date_of_birth: form.date_of_birth || undefined,
        sex: form.sex || undefined,
        mrn: form.mrn || undefined,
        stage: form.stage || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } catch {
      // handled by mutation
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    padding: '9px 12px', fontSize: 14, borderRadius: 'var(--r-sm)',
    border: `1px solid ${hasError ? 'var(--danger-500)' : 'var(--border-2)'}`,
    background: 'var(--bg-surface)', color: 'var(--fg-1)', outline: 'none',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  });

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Edit patient">
        <div className="drawer-head">
          <div>
            <div className="t-h4">Edit Patient</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 2 }}>Update patient information</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'contents' }}>
          <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>
                Full Name <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input value={form.name ?? ''} onChange={e => set('name', e.target.value)} style={inputStyle(!!fieldErrors.name)} />
              {fieldErrors.name && <span style={{ fontSize: 12, color: 'var(--danger-500)' }}>{fieldErrors.name}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Date of Birth</label>
              <input type="date" value={form.date_of_birth ?? ''} onChange={e => set('date_of_birth', e.target.value)} style={inputStyle(false)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Sex</label>
                <select value={form.sex ?? ''} onChange={e => set('sex', e.target.value)} style={inputStyle(false)}>
                  <option value="">— Select —</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>MRN</label>
                <input value={form.mrn ?? ''} onChange={e => set('mrn', e.target.value)} style={inputStyle(false)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Stage</label>
              <select value={form.stage ?? ''} onChange={e => set('stage', e.target.value)} style={inputStyle(false)}>
                <option value="">— Select —</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Notes</label>
              <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
                rows={4} style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.55 }} />
            </div>

            {mutation.isError && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-50)', color: 'var(--danger-700)', borderRadius: 'var(--r-sm)', fontSize: 13 }}>
                Failed to update patient. Please try again.
              </div>
            )}
          </div>

          <div className="drawer-foot">
            <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
