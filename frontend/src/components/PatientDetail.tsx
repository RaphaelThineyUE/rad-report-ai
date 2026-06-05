import { useState, useMemo, useEffect } from 'react';
import { Avatar, Button, Icon } from '@/components/ui';
import { ReportsTab } from './patients/ReportsTab';
import { TreatmentsTab } from './patients/TreatmentsTab';
import { TimelineTab } from './patients/TimelineTab';
import { useAppLayoutContext } from './layout/AppLayout';
import { useExportPatient } from '@/hooks/useExport';
import type { Patient } from '@/hooks/usePatients';

interface PatientDetailProps {
  patient: Patient;
  onClose: () => void;
}

type TabId = 'reports' | 'treatments' | 'timeline';

export function PatientDetail({ patient, onClose }: PatientDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('reports');
  const { setCurrentPatientId } = useAppLayoutContext();
  const exportPatient = useExportPatient();

  // Set patient ID in app context when this detail is opened
  useEffect(() => {
    setCurrentPatientId(patient.id);
    return () => setCurrentPatientId(null);
  }, [patient.id, setCurrentPatientId]);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'reports', label: 'Reports', icon: 'file-text' },
    { id: 'treatments', label: 'Treatments', icon: 'pill' },
    { id: 'timeline', label: 'Timeline', icon: 'calendar' },
  ];

  const age = useMemo(() => {
    const today = new Date();
    const birthDate = new Date(patient.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [patient.date_of_birth]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        className="modal"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: 'var(--r-lg)',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <Avatar initials={getInitials(patient.full_name)} size={42} />
            <div style={{ minWidth: 0 }}>
              <h2 className="t-h3" style={{ margin: 0, marginBottom: 4 }}>
                {patient.full_name}
              </h2>
              <div className="mono" style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                {patient.id} · {age} years old · {patient.gender || 'N/A'}
              </div>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--border-1)',
            paddingLeft: '24px',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--fg-1)' : 'var(--fg-3)',
                borderBottom: activeTab === tab.id ? '2px solid var(--rose-600)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textAlign: 'left',
                minWidth: 'fit-content',
              }}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {activeTab === 'reports' && <ReportsTab patientId={patient.id} patientName={patient.full_name} />}
          {activeTab === 'treatments' && <TreatmentsTab patientId={patient.id} />}
          {activeTab === 'timeline' && <TimelineTab patientId={patient.id} />}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 24px',
            borderTop: '1px solid var(--border-1)',
            background: 'var(--bg-subtle)',
          }}
        >
          <Button variant="secondary" onClick={() => exportPatient(patient.id)} icon="download">
            Export
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
