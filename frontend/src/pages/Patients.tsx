import { useState } from 'react';
import { Avatar, BiRads } from '@/components/ui';
import { ReportDrawer } from '@/components/drawers/ReportDrawer';
import { SAMPLE_PATIENTS, type PatientRow } from '@/types/clinical';

interface PatientsProps {
  search: string;
}

export default function Patients({ search }: PatientsProps) {
  const [selected, setSelected] = useState<PatientRow | null>(null);

  const rows = SAMPLE_PATIENTS.filter(p =>
    !search || (p.name + p.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Patients</h1>
          <div className="sub">Longitudinal records across all studies</div>
        </div>
      </div>

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
              <Avatar initials={p.initials} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
                  {p.id} · {p.age}{p.sex}
                </div>
              </div>
              <BiRads value={p.birads} />
            </div>
            <div className="kv"><span className="k">Latest modality</span><span className="v">{p.modality}</span></div>
            <div className="kv"><span className="k">Density</span><span className="v">{p.density}</span></div>
            <div className="kv">
              <span className="k">Last study</span>
              <span className="v mono" style={{ fontWeight: 500 }}>{p.date}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ReportDrawer patient={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
