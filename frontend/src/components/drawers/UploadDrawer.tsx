/**
 * Right-side drawer for uploading a single radiology PDF (demo/prototype flow).
 * Props: onClose, onComplete. Uses a simulated upload progress rather than
 * real API calls; stages: idle → uploading → extracting → done. Renders a
 * drag-drop zone in idle state, an animated step-progress list during upload,
 * and a summary card with extracted findings on completion.
 */
import { useState } from 'react';
import { Button, Icon } from '@/components/ui';

type Stage = 'idle' | 'uploading' | 'extracting' | 'done';

interface UploadDrawerProps {
  onClose: () => void;
  onComplete: () => void;
}

const STEPS: { id: Stage; label: string; icon: string }[] = [
  { id: 'uploading',   label: 'Encrypting & uploading PDF',    icon: 'lock' },
  { id: 'extracting', label: 'Extracting findings with AI',   icon: 'sparkles' },
  { id: 'done',       label: 'Structured report ready',       icon: 'circle-check' },
];

const STAGE_ORDER: Stage[] = ['uploading', 'extracting', 'done'];

export function UploadDrawer({ onClose, onComplete }: UploadDrawerProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [pct, setPct] = useState(0);

  function start() {
    setStage('uploading');
    setPct(0);
    let v = 0;
    const up = setInterval(() => {
      v += 9 + Math.random() * 12;
      if (v >= 100) {
        clearInterval(up);
        setStage('extracting');
        setTimeout(() => setStage('done'), 1800);
      }
      setPct(Math.min(100, Math.round(v)));
    }, 180);
  }

  const curIdx = STAGE_ORDER.indexOf(stage);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" style={{ width: 480 }} role="dialog" aria-label="Upload report">
        <div className="drawer-head">
          <div>
            <h2 className="t-h3" style={{ margin: 0 }}>Upload report</h2>
            <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 3 }}>Secure PDF → AI extraction</div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none' }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {stage === 'idle' && (
            <div
              onClick={start}
              style={{
                border: '1.5px dashed var(--border-2)', borderRadius: 'var(--r-lg)',
                padding: '44px 24px', textAlign: 'center', cursor: 'pointer',
                background: 'var(--grad-mesh), var(--bg-surface)',
                transition: 'border-color var(--dur-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--rose-400)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px', color: 'var(--rose-600)',
              }}>
                <Icon name="file-up" size={26} />
              </div>
              <div className="t-h4" style={{ marginBottom: 6 }}>Drop a radiology PDF here</div>
              <div className="t-body-sm" style={{ marginBottom: 18 }}>
                or click to browse · encrypted in transit and at rest
              </div>
              <Button icon="upload">Choose file</Button>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginTop: 20, color: 'var(--fg-4)', fontSize: 11.5,
              }}>
                <Icon name="shield" size={13} /> HIPAA-aligned · audit-logged
              </div>
            </div>
          )}

          {stage !== 'idle' && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', marginBottom: 24,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--rose-600)',
                }}>
                  <Icon name="file-text" size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>mammo_report_2026-06.pdf</div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
                    2.4 MB · {stage === 'uploading' ? `${pct}%` : 'uploaded'}
                  </div>
                </div>
                {stage === 'uploading'
                  ? <Icon name="loader" size={20} color="var(--rose-600)" style={{ animation: 'spin .9s linear infinite' }} />
                  : <Icon name="circle-check" size={20} color="var(--success-500)" />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {STEPS.map((s, i) => {
                  const done = stage === 'done' ? i <= curIdx : i < curIdx;
                  const activeNow = i === curIdx && stage !== 'done';
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 4px', opacity: i <= curIdx ? 1 : 0.4,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'var(--success-50)' : activeNow ? 'var(--rose-50)' : 'var(--slate-100)',
                        color: done ? 'var(--success-500)' : activeNow ? 'var(--rose-600)' : 'var(--fg-4)',
                      }}>
                        {done
                          ? <Icon name="check" size={16} />
                          : activeNow
                            ? <Icon name="loader" size={16} style={{ animation: 'spin .9s linear infinite' }} />
                            : <Icon name={s.icon} size={15} />}
                      </div>
                      <span style={{
                        fontSize: 14,
                        fontWeight: done || activeNow ? 600 : 500,
                        color: done || activeNow ? 'var(--fg-1)' : 'var(--fg-3)',
                      }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {stage === 'done' && (
                <div className="fade-up" style={{
                  marginTop: 22, padding: 16, borderRadius: 'var(--r-md)',
                  background: 'var(--bg-rose-tint)', border: '1px solid var(--rose-200)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name="sparkles" size={16} color="var(--rose-600)" />
                    <span className="t-overline" style={{ color: 'var(--rose-700)' }}>3 findings extracted</span>
                  </div>
                  <div className="chip-row">
                    <span className="badge s-neutral">Spiculated mass · 11.0 mm</span>
                    <span className="badge s-neutral">Calcifications</span>
                    <span className="badge s-warning"><span className="bdot" />Suspicious</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            icon={stage === 'done' ? 'arrow-up-right' : 'sparkles'}
            onClick={stage === 'done' ? onComplete : stage === 'idle' ? start : undefined}
            style={stage !== 'idle' && stage !== 'done' ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            {stage === 'done' ? 'Open report' : 'Extract findings'}
          </Button>
        </div>
      </aside>
    </>
  );
}
