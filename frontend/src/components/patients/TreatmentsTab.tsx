import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  TREATMENT_OUTCOMES,
  TREATMENT_TYPES,
  useCreateTreatment,
  useDeleteTreatment,
  useTreatments,
  useUpdateTreatment,
  type Treatment,
  type TreatmentInput,
  type TreatmentOutcome,
  type TreatmentType,
} from '@/hooks/useTreatments';

interface TreatmentsTabProps {
  patientId: string;
}

type TreatmentFormState = Omit<TreatmentInput, 'patient_id'>;

const EMPTY_FORM: TreatmentFormState = {
  treatment_type: 'Surgery',
  treatment_start_date: '',
  treatment_end_date: '',
  medication_details: '',
  treatment_outcome: undefined,
  side_effects: '',
  follow_up_date: '',
};

export function TreatmentsTab({ patientId }: TreatmentsTabProps) {
  const { data: treatments, isLoading, isError } = useTreatments(patientId);
  const createTreatment = useCreateTreatment();
  const updateTreatment = useUpdateTreatment();
  const deleteTreatment = useDeleteTreatment();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TreatmentFormState>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const items = useMemo(() => treatments ?? [], [treatments]);
  const isEditing = !!editingId;

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function beginEdit(item: Treatment) {
    setEditingId(item.id);
    setForm({
      treatment_type: item.treatment_type,
      treatment_start_date: item.treatment_start_date,
      treatment_end_date: item.treatment_end_date ?? '',
      medication_details: item.medication_details ?? '',
      treatment_outcome: item.treatment_outcome ?? undefined,
      side_effects: item.side_effects ?? '',
      follow_up_date: item.follow_up_date ?? '',
    });
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.treatment_start_date) {
      setErrorMessage('Start date is required.');
      return;
    }

    const payload: TreatmentInput = {
      patient_id: patientId,
      treatment_type: form.treatment_type,
      treatment_start_date: form.treatment_start_date,
      ...(form.treatment_end_date ? { treatment_end_date: form.treatment_end_date } : {}),
      ...(form.medication_details ? { medication_details: form.medication_details } : {}),
      ...(form.treatment_outcome ? { treatment_outcome: form.treatment_outcome } : {}),
      ...(form.side_effects ? { side_effects: form.side_effects } : {}),
      ...(form.follow_up_date ? { follow_up_date: form.follow_up_date } : {}),
    };

    try {
      if (editingId) {
        await updateTreatment.mutateAsync({ id: editingId, ...payload });
      } else {
        await createTreatment.mutateAsync(payload);
      }
      resetForm();
    } catch {
      setErrorMessage('Failed to save treatment.');
    }
  }

  async function removeTreatment(treatmentId: string) {
    setErrorMessage(null);
    try {
      await deleteTreatment.mutateAsync({ id: treatmentId, patientId });
      if (editingId === treatmentId) resetForm();
    } catch {
      setErrorMessage('Failed to delete treatment.');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <form onSubmit={submitForm} className="card card-pad" style={{ display: 'grid', gap: 12 }}>
        <h3 className="t-h4" style={{ margin: 0 }}>{isEditing ? 'Edit treatment' : 'Add treatment'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>Type</span>
            <select
              value={form.treatment_type}
              onChange={(event) => setForm((prev) => ({ ...prev, treatment_type: event.target.value as TreatmentType }))}
              style={inputStyle}
            >
              {TREATMENT_TYPES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>Start date</span>
            <input
              type="date"
              value={form.treatment_start_date}
              onChange={(event) => setForm((prev) => ({ ...prev, treatment_start_date: event.target.value }))}
              style={inputStyle}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>End date</span>
            <input
              type="date"
              value={form.treatment_end_date}
              onChange={(event) => setForm((prev) => ({ ...prev, treatment_end_date: event.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>Outcome</span>
            <select
              value={form.treatment_outcome ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, treatment_outcome: (event.target.value || undefined) as TreatmentOutcome | undefined }))}
              style={inputStyle}
            >
              <option value="">— Select —</option>
              {TREATMENT_OUTCOMES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>Follow-up date</span>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={(event) => setForm((prev) => ({ ...prev, follow_up_date: event.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>Medication details</span>
          <textarea
            rows={3}
            value={form.medication_details}
            onChange={(event) => setForm((prev) => ({ ...prev, medication_details: event.target.value }))}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 600 }}>Side effects</span>
          <textarea
            rows={2}
            value={form.side_effects}
            onChange={(event) => setForm((prev) => ({ ...prev, side_effects: event.target.value }))}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </label>

        {errorMessage && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--danger-50)', color: 'var(--danger-700)' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {isEditing && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          )}
          <Button type="submit" icon={createTreatment.isPending || updateTreatment.isPending ? 'Loader2' : 'check'}>
            {isEditing ? 'Save changes' : 'Add treatment'}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="card card-pad" style={{ color: 'var(--fg-3)' }}>Loading treatments…</div>
      ) : isError ? (
        <div className="card card-pad" style={{ color: 'var(--danger-700)' }}>Failed to load treatments.</div>
      ) : !items.length ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--fg-3)' }}>
          <Icon name="Pill" size={36} />
          <h3 className="t-h3" style={{ marginTop: 12, marginBottom: 8 }}>No treatments recorded</h3>
          <p style={{ color: 'var(--fg-4)', margin: 0 }}>Add a treatment entry to build the care timeline.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} className="card card-pad" style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.treatment_type}</div>
                  <div className="mono" style={{ color: 'var(--fg-4)', fontSize: 12 }}>
                    {item.treatment_start_date}
                    {item.treatment_end_date ? ` → ${item.treatment_end_date}` : ' → ongoing'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button type="button" size="sm" variant="secondary" icon="Pencil" onClick={() => beginEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon="Trash2"
                    style={{ color: 'var(--danger-700)', borderColor: 'var(--danger-200)' }}
                    onClick={() => {
                      void removeTreatment(item.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {item.treatment_outcome && (
                <div className="kv">
                  <span className="k">Outcome</span>
                  <span className="v">{item.treatment_outcome}</span>
                </div>
              )}
              {item.medication_details && (
                <div className="kv">
                  <span className="k">Medication</span>
                  <span className="v">{item.medication_details}</span>
                </div>
              )}
              {item.side_effects && (
                <div className="kv">
                  <span className="k">Side effects</span>
                  <span className="v">{item.side_effects}</span>
                </div>
              )}
              {item.follow_up_date && (
                <div className="kv">
                  <span className="k">Follow-up</span>
                  <span className="v mono">{item.follow_up_date}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  fontSize: 14,
  borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border-2)',
  background: 'var(--bg-surface)',
  color: 'var(--fg-1)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};
