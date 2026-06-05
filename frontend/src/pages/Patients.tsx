import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui';
import { usePatients, type Patient } from '@/hooks/usePatients';
import { AddPatientDialog } from '@/components/dialogs/AddPatientDialog';
import { OnboardingModal } from '@/components/dialogs/OnboardingModal';
import { PatientDetail } from '@/components/PatientDetail';

interface PatientsProps {
  search: string;
}

export default function Patients({ search }: PatientsProps) {
  const { data: patients, isLoading, error } = usePatients();
  const [selected, setSelected] = useState<Patient | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Show onboarding modal on first visit (no patients, not loading)
  useEffect(() => {
    if (!isLoading && patients && patients.length === 0 && !showAddDialog) {
      setShowOnboarding(true);
    }
  }, [patients, isLoading, showAddDialog]);

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      // TODO: Implement demo data seeding
      // This would create 2 sample patients with 3 reports each
      // For now, just close the modal and let users add their own data
      setTimeout(() => {
        setShowOnboarding(false);
        setLoadingDemo(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load demo data:', error);
      setLoadingDemo(false);
    }
  };

  const rows = (patients || []).filter(p =>
    !search || (p.full_name + p.id).toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (error) {
    return (
      <div className="fade-up">
        <div className="page-head">
          <div>
            <h1 className="t-h1">Patients</h1>
            <div className="sub">Error loading patients</div>
          </div>
        </div>
        <div className="card card-pad" style={{ color: 'var(--fg-3)' }}>
          Failed to load patients. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Patients</h1>
          <div className="sub">Longitudinal records across all studies</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddDialog(true)}>
          Add Patient
        </button>
      </div>

      {isLoading ? (
        <div className="card card-pad" style={{ color: 'var(--fg-3)', textAlign: 'center' }}>
          Loading patients...
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-3)' }}>
          <p style={{ margin: 0 }}>No patients found. Start by adding a new patient or loading demo data.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {rows.map(p => (
            <div
              key={p.id}
              className="card card-pad"
              onClick={() => setSelected(p)}
              style={{ cursor: 'pointer', transition: 'box-shadow var(--dur-fast), transform var(--dur-fast)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar initials={getInitials(p.full_name)} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.full_name}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
                    {p.id} · {p.gender || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="kv"><span className="k">Cancer type</span><span className="v">{p.cancer_type}</span></div>
              <div className="kv"><span className="k">Stage</span><span className="v">{p.cancer_stage || 'Unknown'}</span></div>
              <div className="kv">
                <span className="k">Diagnosed</span>
                <span className="v mono" style={{ fontWeight: 500 }}>{new Date(p.diagnosis_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PatientDetail patient={selected} onClose={() => setSelected(null)} />
      )}

      {showAddDialog && (
        <AddPatientDialog onClose={() => setShowAddDialog(false)} />
      )}

      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onLoadDemo={handleLoadDemo}
          isLoading={loadingDemo}
        />
      )}
    </div>
  );
}
