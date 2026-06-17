/**
 * Dashboard page — overview of clinical practice metrics and upcoming follow-ups.
 * Fetches summary stats from /api/analytics and all patients from /api/patients,
 * then fans out per-patient treatment requests to compute follow-ups due within ±30 days.
 * Displays five MetricCards, a patient selector with quick stats, and a follow-up reminder list.
 * Data is fetched imperatively (not via TanStack Query) on mount via Promise.all.
 * Wrapped in ErrorBoundary to gracefully handle render errors.
 */
import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageErrorFallback } from '@/components/PageErrorFallback';
import type { Patient } from '@/hooks/usePatients';

interface DashboardStats {
  total_patients: number;
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  avg_processing_time_ms: number;
}

interface FollowUpItem {
  patient_id: string;
  patient_name: string;
  follow_up_date: string;
  days_until_due: number;
  last_treatment_type?: string;
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [followUpItems, setFollowUpItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useApiError();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, patientsRes] = await Promise.all([
        api.get('/api/analytics'),
        api.get('/api/patients'),
      ]);

      setStats(statsRes.data.summary);
      setPatients(patientsRes.data?.patients || patientsRes.data || []);

      // Calculate follow-up items from treatment records
      const followUpData: FollowUpItem[] = [];
      for (const patient of patientsRes.data?.patients || patientsRes.data || []) {
        try {
          const treatmentsRes = await api.get(`/api/treatments?patient_id=${patient.id}`);
          const treatments = treatmentsRes.data?.treatments || treatmentsRes.data || [];

          for (const treatment of treatments) {
            if (treatment.follow_up_date) {
              const dueDate = new Date(treatment.follow_up_date);
              const today = new Date();
              const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (daysUntil <= 30 && daysUntil >= -30) {
                followUpData.push({
                  patient_id: patient.id,
                  patient_name: patient.full_name,
                  follow_up_date: treatment.follow_up_date,
                  days_until_due: daysUntil,
                  last_treatment_type: treatment.treatment_type,
                });
              }
            }
          }
        } catch {
          // Skip if error fetching treatments
        }
      }

      setFollowUpItems(followUpData.sort((a, b) => a.days_until_due - b.days_until_due));
    } catch (err) {
      const msg = handleError(err, 'Failed to load dashboard data', false);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getFollowUpStatus = (daysUntil: number): 'urgent' | 'upcoming' | 'overdue' => {
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    return 'upcoming';
  };

  const getFollowUpColor = (status: 'urgent' | 'upcoming' | 'overdue'): string => {
    switch (status) {
      case 'overdue':
        return 'var(--danger-50)';
      case 'urgent':
        return 'var(--warning-50)';
      default:
        return 'var(--slate-50)';
    }
  };

  const getFollowUpBorderColor = (status: 'urgent' | 'upcoming' | 'overdue'): string => {
    switch (status) {
      case 'overdue':
        return 'var(--danger-200)';
      case 'urgent':
        return 'var(--warning-200)';
      default:
        return 'var(--slate-200)';
    }
  };

  if (error) {
    return (
      <PageErrorFallback
        error={new Error(error)}
        resetErrorBoundary={fetchDashboardData}
        title="Dashboard Error"
        description={error}
      />
    );
  }

  if (loading) {
    return (
      <div className="fade-up">
        <div className="page-head">
          <h1 className="t-h1">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Dashboard</h1>
          <div className="sub">Overview of your clinical practice</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Patients" value={String(stats?.total_patients || 0)} icon="users" />
        <MetricCard label="Total Reports" value={String(stats?.total_reports || 0)} icon="file-text" />
        <MetricCard label="Completed" value={String(stats?.completed_reports || 0)} icon="check-circle" />
        <MetricCard label="Failed" value={String(stats?.failed_reports || 0)} icon="alert-triangle" />
        <MetricCard label="Avg Time" value={`${((stats?.avg_processing_time_ms || 0) / 1000).toFixed(1)}s`} icon="clock" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Patient Selector</h3>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--slate-300)',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.cancer_stage})
              </option>
            ))}
          </select>
          {selectedPatientId && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--slate-50)', borderRadius: 6, fontSize: 13 }}>
              {patients.find((p) => p.id === selectedPatientId) && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Stage:</strong> {patients.find((p) => p.id === selectedPatientId)?.cancer_stage}
                  </div>
                  <div>
                    <strong>Diagnosis:</strong> {patients.find((p) => p.id === selectedPatientId)?.cancer_type}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: 'var(--slate-50)', borderRadius: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-600)' }}>
                {patients.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>Total Patients</div>
            </div>
            <div style={{ padding: 12, background: 'var(--slate-50)', borderRadius: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success-600)' }}>
                {stats?.completed_reports || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>Reports Done</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Follow-Up Due Reminders</h3>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{followUpItems.length} items</span>
        </div>

        {followUpItems.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>
            <div style={{ fontSize: 13 }}>No follow-ups due in the next 30 days</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {followUpItems.map((item) => {
              const status = getFollowUpStatus(item.days_until_due);
              const bgColor = getFollowUpColor(status);
              const borderColor = getFollowUpBorderColor(status);

              return (
                <div
                  key={`${item.patient_id}-${item.follow_up_date}`}
                  style={{
                    padding: 12,
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                        {item.patient_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                        {item.last_treatment_type && `${item.last_treatment_type} • `}
                        Due: {new Date(item.follow_up_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.days_until_due < 0 ? (
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger-700)' }}>
                          {Math.abs(item.days_until_due)} days overdue
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>
                          {item.days_until_due} days
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary
      fallback={(error: Error, retry: () => void) => (
        <PageErrorFallback
          error={error}
          resetErrorBoundary={retry}
          title="Dashboard Error"
          description="An unexpected error occurred while displaying the dashboard."
        />
      )}
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}
