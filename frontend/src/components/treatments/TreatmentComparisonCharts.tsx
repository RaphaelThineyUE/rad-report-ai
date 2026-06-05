import { useMemo } from 'react';

interface Treatment {
  id: string;
  treatment_type: string;
  treatment_start_date: string;
  treatment_outcome?: string;
  side_effects?: string;
  medication_details?: string;
}

interface TreatmentComparisonChartsProps {
  treatments: Treatment[];
}

interface TreatmentScore {
  type: string;
  efficacy: number;
  sideEffect: number;
  duration: number;
}

export function TreatmentComparisonCharts({ treatments }: TreatmentComparisonChartsProps) {
  const treatmentScores = useMemo(() => {
    if (treatments.length === 0) return [];

    return treatments.map((t) => ({
      type: t.treatment_type,
      efficacy: t.treatment_outcome ? (t.treatment_outcome.toLowerCase().includes('improved') ? 85 : 60) : 70,
      sideEffect: t.side_effects ? 70 : 40,
      duration: t.treatment_end_date
        ? Math.round((new Date(t.treatment_end_date as any).getTime() - new Date(t.treatment_start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));
  }, [treatments]);

  if (treatmentScores.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ color: 'var(--fg-3)', fontSize: 14 }}>No treatments to compare</div>
      </div>
    );
  }

  const maxDuration = Math.max(...treatmentScores.map((t) => t.duration), 30);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="card card-pad">
        <span className="t-overline">Treatment Efficacy Scores</span>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {treatmentScores.map((score) => (
            <div key={score.type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{score.type}</span>
                <span style={{ color: 'var(--fg-3)' }}>{score.efficacy}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--slate-100)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${score.efficacy}%`,
                    height: '100%',
                    background: score.efficacy > 75 ? 'var(--success-500)' : score.efficacy > 60 ? 'var(--warning-500)' : 'var(--danger-500)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <span className="t-overline">Side Effect Profile</span>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {treatmentScores.map((score) => (
            <div key={`se-${score.type}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{score.type}</span>
                <span style={{ color: 'var(--fg-3)' }}>{score.sideEffect}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--slate-100)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${score.sideEffect}%`,
                    height: '100%',
                    background: score.sideEffect > 70 ? 'var(--danger-500)' : score.sideEffect > 40 ? 'var(--warning-500)' : 'var(--success-500)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ gridColumn: '1 / -1' }}>
        <span className="t-overline">Treatment Duration Comparison</span>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
          {treatmentScores.map((score) => (
            <div key={`dur-${score.type}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: '100%',
                  height: (score.duration / maxDuration) * 120,
                  borderRadius: '4px 4px 0 0',
                  background: 'var(--blue-400)',
                }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)' }}>{score.duration}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>days</div>
              </div>
              <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--fg-2)', wordBreak: 'break-word' }}>{score.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
