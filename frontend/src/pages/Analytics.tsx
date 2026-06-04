import { MetricCard } from '@/components/ui';

const BIRADS_DIST = [
  { k: '1–2',   v: 38, c: 'var(--success-500)' },
  { k: '3',     v: 24, c: 'var(--info-500)'    },
  { k: '4A',    v: 16, c: 'var(--warning-500)' },
  { k: '4B–4C', v: 14, c: '#E2700A'             },
  { k: '5',     v: 8,  c: 'var(--danger-500)'  },
];

const MONTHS = [62, 70, 58, 81, 76, 94, 88, 102, 96, 118, 110, 128];
const MONTH_LABELS = ['J','F','M','A','M','J','J','A','S','O','N','D'];
const MAX_M = Math.max(...MONTHS);

export default function Analytics() {
  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Analytics</h1>
          <div className="sub">Consolidated reporting · last 30 days</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard label="Reports extracted"   value="1,284" delta="12.4% vs. April"  icon="file-text"   />
        <MetricCard label="Avg. extraction time" value="3.2s"  delta="0.8s faster"      icon="clock"       />
        <MetricCard label="Findings flagged"     value="312"   delta="6.1% vs. April"   icon="alert-triangle" />
        <MetricCard label="Care-team alerts"     value="47"    delta="3 fewer" deltaDir="down" icon="heart-pulse" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Monthly bar chart */}
        <div className="card card-pad">
          <span className="t-overline">Reports per month</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 188, marginTop: 18 }}>
            {MONTHS.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: '100%',
                  height: (m / MAX_M) * 160,
                  borderRadius: '5px 5px 0 0',
                  background: i === MONTHS.length - 1 ? 'var(--grad-rose)' : 'var(--rose-200)',
                }} />
                <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)' }}>{MONTH_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BI-RADS distribution */}
        <div className="card card-pad">
          <span className="t-overline">BI-RADS distribution</span>
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BIRADS_DIST.map(d => (
              <div key={d.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: 'var(--fg-1)' }}>{d.k}</span>
                  <span className="mono" style={{ color: 'var(--fg-3)' }}>{d.v}%</span>
                </div>
                <div style={{ height: 9, borderRadius: 5, background: 'var(--slate-100)', overflow: 'hidden' }}>
                  <div style={{ width: `${d.v * 2.6}%`, height: '100%', background: d.c, borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
