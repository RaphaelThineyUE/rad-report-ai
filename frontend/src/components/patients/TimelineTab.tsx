/**
 * Tab panel rendering a chronological timeline of reports and treatments.
 * Props: patientId (string).
 * Merges events from useReports + useTreatments, sorts by date descending,
 * and displays each event as a card on a vertical connector line.
 * Report events show BI-RADS value; treatment events show outcome/medication.
 */
import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useReports } from '@/hooks/useReports';
import { useTreatments } from '@/hooks/useTreatments';

interface TimelineTabProps {
  patientId: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'report' | 'treatment';
}

export function TimelineTab({ patientId }: TimelineTabProps) {
  const reportsQuery = useReports(patientId);
  const treatmentsQuery = useTreatments(patientId);

  const events = useMemo<TimelineEvent[]>(() => {
    const reportEvents = (reportsQuery.data ?? []).map((report) => ({
      id: `report-${report.id}`,
      date: report.created_at.slice(0, 10),
      title: `Report uploaded · ${report.filename}`,
      description:
        report.status === 'completed'
          ? `Status: completed${report.birads_value ? ` · BI-RADS ${report.birads_value}` : ''}`
          : `Status: ${report.status}`,
      type: 'report' as const,
    }));

    const treatmentEvents = (treatmentsQuery.data ?? []).map((treatment) => ({
      id: `treatment-${treatment.id}`,
      date: treatment.treatment_start_date,
      title: `Treatment started · ${treatment.treatment_type}`,
      description: treatment.treatment_outcome
        ? `Outcome: ${treatment.treatment_outcome}`
        : treatment.medication_details ?? 'No additional details',
      type: 'treatment' as const,
    }));

    return [...reportEvents, ...treatmentEvents].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reportsQuery.data, treatmentsQuery.data]);

  if (reportsQuery.isLoading || treatmentsQuery.isLoading) {
    return <div className="card card-pad" style={{ color: 'var(--fg-3)' }}>Loading timeline…</div>;
  }

  if (reportsQuery.isError || treatmentsQuery.isError) {
    return <div className="card card-pad" style={{ color: 'var(--danger-700)' }}>Failed to load timeline.</div>;
  }

  if (!events.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-3)' }}>
        <Icon name="GitBranch" size={36} />
        <h3 className="t-h3" style={{ marginTop: 12, marginBottom: 8 }}>No timeline events yet</h3>
        <p style={{ color: 'var(--fg-4)', margin: 0 }}>Reports and treatments will appear in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 18 }}>Patient timeline</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {events.map((event, index) => (
          <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'start' }}>
            <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: event.type === 'report' ? 'var(--rose-50)' : 'var(--success-50)',
                  color: event.type === 'report' ? 'var(--rose-700)' : 'var(--success-700)',
                }}
              >
                <Icon name={event.type === 'report' ? 'FileText' : 'Pill'} size={13} />
              </span>
              {index < events.length - 1 && <span style={{ width: 1, flex: 1, minHeight: 28, background: 'var(--border-1)' }} />}
            </div>
            <div style={{ border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong>{event.title}</strong>
                <span className="mono" style={{ color: 'var(--fg-4)', fontSize: 12 }}>{event.date}</span>
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--fg-3)', fontSize: 13 }}>{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
