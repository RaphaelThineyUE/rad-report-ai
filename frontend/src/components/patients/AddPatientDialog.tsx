import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useCreatePatient, type CreatePatientInput } from '@/hooks/usePatients';

interface AddPatientDialogProps {
  onClose: () => void;
}

const STAGES = ['Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown'];

const EMPTY: CreatePatientInput = {
  name: '',
  date_of_birth: '',
  sex: undefined,
  mrn: '',
  stage: '',
  notes: '',
};

export function AddPatientDialog({ onClose }: AddPatientDialogProps) {
  const [form, setForm] = useState<CreatePatientInput>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const mutation = useCreatePatient();
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

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
    const payload: CreatePatientInput = {
      name: form.name!.trim(),
      ...(form.date_of_birth ? { date_of_birth: form.date_of_birth } : {}),
      ...(form.sex ? { sex: form.sex } : {}),
      ...(form.mrn ? { mrn: form.mrn } : {}),
      ...(form.stage ? { stage: form.stage } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    };
    try {
      await mutation.mutateAsync(payload);
      onClose();
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Add patient">
        <div className="drawer-head">
          <div>
            <div className="t-h4">Add Patient</div>
            <div style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 2 }}>
              Create a new patient record
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'contents' }}>
          <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>
                Full Name <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                ref={firstRef}
                value={form.name ?? ''}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Jane Doe"
                style={inputStyle(!!fieldErrors.name)}
              />
              {fieldErrors.name && (
                <span style={{ fontSize: 12, color: 'var(--danger-500)' }}>{fieldErrors.name}</span>
              )}
            </div>

            {/* Date of Birth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={form.date_of_birth ?? ''}
                onChange={e => set('date_of_birth', e.target.value)}
                style={inputStyle(false)}
              />
            </div>

            {/* Sex + MRN row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Sex</label>
                <select
                  value={form.sex ?? ''}
                  onChange={e => set('sex', e.target.value)}
                  style={inputStyle(false)}
                >
                  <option value="">— Select —</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>MRN</label>
                <input
                  value={form.mrn ?? ''}
                  onChange={e => set('mrn', e.target.value)}
                  placeholder="Medical record #"
                  style={inputStyle(false)}
                />
              </div>
            </div>

            {/* Stage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Stage</label>
              <select
                value={form.stage ?? ''}
                onChange={e => set('stage', e.target.value)}
                style={inputStyle(false)}
              >
                <option value="">— Select —</option>
                {STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>Notes</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="Clinical notes, history, context…"
                rows={4}
                style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.55 }}
              />
            </div>

            {mutation.isError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--danger-50)',
                  color: 'var(--danger-700)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 13,
                }}
              >
                Failed to create patient. Please try again.
              </div>
            )}
          </div>

          <div className="drawer-foot">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={mutation.isPending}
              icon={mutation.isPending ? 'Loader2' : undefined}
            >
              {mutation.isPending ? 'Saving…' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: '9px 12px',
    fontSize: 14,
    borderRadius: 'var(--r-sm)',
    border: `1px solid ${hasError ? 'var(--danger-500)' : 'var(--border-2)'}`,
    background: 'var(--bg-surface)',
    color: 'var(--fg-1)',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box' as const,
  };
}
