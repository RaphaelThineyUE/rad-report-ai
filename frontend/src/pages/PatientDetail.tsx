import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient, useDeletePatient } from '@/hooks/usePatients';
import { PatientAvatar, StageBadge } from '@/components/patients/StageBadge';
import { EditPatientDialog } from '@/components/patients/EditPatientDialog';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type TabId = 'overview' | 'reports' | 'treatments' | 'timeline';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Reports' },
  { id: 'treatments', label: 'Treatments' },
  { id: 'timeline', label: 'Timeline' },
];

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatient(id);
  const deleteMutation = useDeletePatient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (isLoading) return <PatientDetailSkeleton />;
  if (isError || !patient) return <PatientNotFound />;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(patient!.id);
      navigate('/patients');
    } catch { /* handled by mutation */ }
  }

  const sexLabel = patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex ?? null;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/patients')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--fg-brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16 }}
        >
          <Icon name="ChevronLeft" size={15} /> Back to Patients
        </button>

        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <PatientAvatar name={patient.name} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="t-h2" style={{ margin: 0, marginBottom: 8 }}>{patient.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {patient.mrn && (
                  <MetaBadge icon="Hash" label={`MRN: ${patient.mrn}`} />
                )}
                {patient.stage && <StageBadge stage={patient.stage} />}
                {sexLabel && <MetaBadge icon="User" label={sexLabel} />}
                {patient.date_of_birth && (
                  <MetaBadge icon="Calendar" label={patient.date_of_birth.slice(0, 10)} />
                )}
                <MetaBadge icon="Clock" label={`Added ${patient.created_at.slice(0, 10)}`} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
              <Button variant="secondary" size="sm" icon="Pencil" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button variant="secondary" size="sm" icon="Trash2" onClick={() => setDeleteConfirm(true)}
                style={{ color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-1)', marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--rose-600)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--rose-700)' : 'var(--fg-3)',
              fontWeight: activeTab === tab.id ? 600 : 500, fontSize: 14,
              cursor: 'pointer', transition: 'all var(--dur-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab patient={patient} />}
      {activeTab === 'reports' && <PlaceholderTab icon="FileText" title="No reports yet" desc="Radiology reports will appear here once uploaded. (Coming in Milestone 6)" />}
      {activeTab === 'treatments' && <PlaceholderTab icon="Pill" title="No treatments yet" desc="Treatment records will appear here once added. (Coming in Milestone 7)" />}
      {activeTab === 'timeline' && <PlaceholderTab icon="GitBranch" title="Timeline coming soon" desc="A chronological view of all events will be available in Milestone 7." />}

      {/* Edit dialog */}
      {editOpen && <EditPatientDialog patient={patient} onClose={() => setEditOpen(false)} />}

      {/* Delete confirm */}
      {deleteConfirm && (
        <>
          <div className="scrim" onClick={() => setDeleteConfirm(false)} />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 42 }}>
            <div className="card card-pad" style={{ width: 420, maxWidth: '92vw', textAlign: 'center' }}>
              <Icon name="AlertTriangle" size={36} style={{ color: 'var(--danger-500)', margin: '0 auto 12px' }} />
              <div className="t-h4" style={{ marginBottom: 8 }}>Delete Patient</div>
              <p style={{ color: 'var(--fg-3)', fontSize: 14, marginBottom: 24 }}>
                Are you sure you want to delete <strong>{patient.name}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="btn"
                  style={{ background: 'var(--danger-500)', color: '#fff', borderColor: 'transparent', boxShadow: 'none' }}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetaBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: 'var(--fg-3)', background: 'var(--bg-subtle)', padding: '3px 9px', borderRadius: 'var(--r-pill)' }}>
      <Icon name={icon} size={11} />
      {label}
    </span>
  );
}

function OverviewTab({ patient }: { patient: { notes: string | null; stage: string | null; date_of_birth: string | null; sex: string | null } }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      <div className="card card-pad">
        <div className="t-h4" style={{ marginBottom: 14 }}>Clinical Notes</div>
        {patient.notes ? (
          <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{patient.notes}</p>
        ) : (
          <p style={{ color: 'var(--fg-4)', fontSize: 14, fontStyle: 'italic' }}>No notes recorded.</p>
        )}
      </div>
      <div className="card card-pad">
        <div className="t-h4" style={{ marginBottom: 14 }}>Key Information</div>
        <div className="kv"><span className="k">Stage</span><span className="v">{patient.stage ?? '—'}</span></div>
        <div className="kv">
          <span className="k">Sex</span>
          <span className="v">{patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex ?? '—'}</span>
        </div>
        <div className="kv"><span className="k">Date of birth</span><span className="v mono">{patient.date_of_birth ? patient.date_of_birth.slice(0, 10) : '—'}</span></div>
        <div className="kv"><span className="k">Follow-up</span><span className="v" style={{ color: 'var(--fg-4)', fontStyle: 'italic' }}>Not scheduled</span></div>
      </div>
    </div>
  );
}

function PlaceholderTab({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-3)' }}>
      <Icon name={icon} size={40} />
      <h3 className="t-h3" style={{ marginTop: 16, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--fg-4)', maxWidth: 400, margin: '0 auto' }}>{desc}</p>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="fade-up">
      <div className="card card-pad" style={{ marginBottom: 24, opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-subtle)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 24, width: '40%', background: 'var(--bg-subtle)', borderRadius: 8, marginBottom: 12 }} />
            <div style={{ height: 14, width: '60%', background: 'var(--bg-subtle)', borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientNotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '72px 24px', color: 'var(--fg-3)' }}>
      <Icon name="UserX" size={40} />
      <h3 className="t-h3" style={{ marginTop: 16 }}>Patient not found</h3>
      <p style={{ color: 'var(--fg-4)' }}>This patient may have been deleted or does not exist.</p>
      <div style={{ marginTop: 20 }}>
        <Button variant="primary" onClick={() => navigate('/patients')}>Back to Patients</Button>
      </div>
    </div>
  );
}
