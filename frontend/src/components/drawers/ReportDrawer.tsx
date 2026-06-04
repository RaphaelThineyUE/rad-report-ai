import { Avatar, Badge, BiRads, Button, Icon } from '@/components/ui';
import type { PatientRow } from '@/types/clinical';

interface ReportDrawerProps {
  patient: PatientRow;
  onClose: () => void;
}

export function ReportDrawer({ patient: p, onClose }: ReportDrawerProps) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Report detail">
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <Avatar initials={p.initials} size={46} />
            <div>
              <h2 className="t-h3" style={{ margin: 0 }}>{p.name}</h2>
              <div className="mono" style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>
                {p.id} · {p.age}{p.sex} · {p.accession}
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none' }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
            <BiRads value={p.birads} size="lg" />
            <Badge status={p.status} />
            <span className="badge s-neutral" style={{ marginLeft: 'auto' }}>{p.modality}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="sparkles" size={16} color="var(--rose-600)" />
            <span className="t-overline" style={{ color: 'var(--rose-700)' }}>AI-extracted findings</span>
          </div>

          <div className="card" style={{ boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 22 }}>
            {p.findings.map((f, i) => (
              <div key={i} style={{
                padding: '13px 16px',
                borderTop: i ? '1px solid var(--border-1)' : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{f.type}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>
                    {f.region}{f.measure !== '—' ? ` · ${f.measure}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                    {Math.round(f.conf * 100)}%
                  </div>
                  <div style={{ width: 64, height: 5, borderRadius: 3, background: 'var(--slate-100)', marginTop: 4 }}>
                    <div style={{
                      width: `${f.conf * 100}%`, height: '100%', borderRadius: 3,
                      background: 'var(--grad-rose)',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <span className="t-overline">Impression</span>
          <p className="t-body" style={{ marginTop: 8, marginBottom: 22 }}>{p.impression}</p>

          <span className="t-overline">Study details</span>
          <div style={{ marginTop: 6 }}>
            <div className="kv"><span className="k">Laterality</span><span className="v">{p.side}</span></div>
            <div className="kv"><span className="k">Lesion size</span><span className="v mono" style={{ fontWeight: 500 }}>{p.size}</span></div>
            <div className="kv"><span className="k">Breast density</span><span className="v">{p.density}</span></div>
            <div className="kv"><span className="k">Study date</span><span className="v mono" style={{ fontWeight: 500 }}>{p.date}</span></div>
          </div>

          <div style={{
            marginTop: 24, padding: '12px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--warning-50)', border: '1px solid #f6e2b3',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Icon name="alert-triangle" size={16} color="var(--warning-700)" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--warning-700)', lineHeight: 1.5 }}>
              This analysis is AI-generated and must be reviewed by a qualified radiologist before clinical use.
            </p>
          </div>
        </div>

        <div className="drawer-foot">
          <Button variant="secondary" icon="download">Export PDF</Button>
          <Button icon="check">Confirm &amp; save</Button>
        </div>
      </aside>
    </>
  );
}
