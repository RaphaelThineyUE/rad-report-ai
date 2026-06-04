import { useState } from 'react';
import { Avatar, Badge, BiRads, Button, Icon } from '@/components/ui';
import { ReportDrawer } from '@/components/drawers/ReportDrawer';
import { SAMPLE_PATIENTS, type PatientRow } from '@/types/clinical';

interface WorklistProps {
  search: string;
}

export default function Worklist({ search }: WorklistProps) {
  const [selected, setSelected] = useState<PatientRow | null>(null);

  const rows = SAMPLE_PATIENTS.filter(p =>
    !search || (p.name + p.id + p.accession + p.modality).toLowerCase().includes(search.toLowerCase())
  );

  const needAttention = rows.filter(r => r.status === 'urgent' || r.status === 'followup').length;

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
            {rows.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar initials={p.initials} size={34} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--fg-1)', fontSize: 14 }}>{p.name}</div>
                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
                        {p.id} · {p.age}{p.sex}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="mono">{p.accession}</td>
                <td>{p.modality}</td>
                <td><BiRads value={p.birads} /></td>
                <td><Badge status={p.status} /></td>
                <td className="mono">{p.date}</td>
                <td style={{ textAlign: 'right' }}>
                  <Icon name="chevron-right" size={18} color="var(--fg-4)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ReportDrawer patient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
