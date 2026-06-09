/**
 * Worklist page — tabular view of all radiology study rows with BI-RADS scores and statuses.
 * Data comes from the backend API (patients + reports); filtered by the `search` prop.
 * Clicking a row opens ReportDrawer (slide-over) for the selected PatientRow.
 * Exposes Filter and Export buttons (stubs). Accepts a `search` prop from the parent layout.
 */
import { useState, useMemo } from 'react';
import { Avatar, Badge, BiRads, Button, Icon } from '@/components/ui';
import { ReportDrawer } from '@/components/drawers/ReportDrawer';
import { usePatients } from '@/hooks/usePatients';
import { useReports, type Report } from '@/hooks/useReports';
import { type PatientRow } from '@/types/clinical';

interface WorklistProps {
  search: string;
}

export default function Worklist({ search }: WorklistProps) {
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const { data: patients, isLoading: patientsLoading } = usePatients();

  // Fetch reports for all patients
  const reportQueries = (patients || []).map(p =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useReports(p.id)
  );

  // Flatten patients + reports into PatientRow format
  const rows = useMemo(() => {
    if (!patients) return [];

    const flattened: PatientRow[] = [];
    patients.forEach((patient, idx) => {
      const reportsData = reportQueries[idx]?.data || [];

      reportsData.forEach((report: Report) => {
        flattened.push({
          id: report.id,
          name: patient.full_name,
          age: new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear(),
          sex: (patient.gender || '').charAt(0),
          initials: patient.full_name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2),
          filename: report.filename,
          accession: report.id.slice(0, 12).toUpperCase(),
          modality: report.exam_type || 'Unknown',
          birads: report.birads_value?.toString() || '—',
          status: report.status,
          date: new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
          size: '—',
          side: '—',
          density: report.breast_density_value || '—',
          impression: report.summary || '',
          findings: [],
        });
      });
    });

    // Filter by search
    return flattened.filter(p =>
      !search || (p.name + p.id + p.accession + p.modality).toLowerCase().includes(search.toLowerCase())
    );
  }, [patients, reportQueries, search]);

  const needAttention = rows.filter(r => r.status === 'urgent' || r.status === 'followup').length;

  if (patientsLoading) {
    return (
      <div className="fade-up">
        <div className="page-head">
          <div>
            <h1 className="t-h1">Worklist</h1>
            <div className="sub">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Worklist</h1>
          <div className="sub">{rows.length} reports · {needAttention} need attention</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon="filter" size="sm">Filter</Button>
          <Button variant="secondary" icon="download" size="sm">Export</Button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px 8px 8px', overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Accession</th>
              <th>Modality</th>
              <th>BI-RADS</th>
              <th>Status</th>
              <th>Study date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--fg-3)' }}>
                  No reports found. Add a patient and upload a radiology report to get started.
                </td>
              </tr>
            ) : (
              rows.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar initials={p.initials} size={34} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--fg-1)', fontSize: 14 }}>{p.name}</div>
                        <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
                          {p.age}{p.sex}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{p.filename}</td>
                  <td>{p.modality}</td>
                  <td><BiRads value={p.birads} /></td>
                  <td><Badge status={p.status} /></td>
                  <td className="mono">{p.date}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Icon name="chevron-right" size={18} color="var(--fg-4)" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ReportDrawer patient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
