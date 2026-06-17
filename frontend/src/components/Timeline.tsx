/**
 * Timeline component — displays BI-RADS, density, findings over time for multi-report histories.
 * Props: data (TimelinePoint[]), isLoading, isError.
 * Renders reports chronologically (oldest to newest) with:
 * - Vertical timeline layout with connected dots
 * - Color-coded BI-RADS levels (0=blue, 1-2=green, 3=yellow, 4=orange, 5=red, 6=dark red)
 * - Exam date, modality, BI-RADS value, key changes
 * - Hover effects to reveal full details
 * Responsive on mobile (stacks vertically).
 */
import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { TimelinePoint } from '@/hooks/useConsolidation';

interface TimelineProps {
  data: TimelinePoint[];
  isLoading?: boolean;
  isError?: boolean;
}

export function Timeline({ data, isLoading = false, isError = false }: TimelineProps) {
  // Color mapping for BI-RADS levels
  const getBiRadsColor = (value: number | null): string => {
    if (value === null) return 'var(--slate-400)';
    if (value === 0) return 'var(--info-600)';        // Blue
    if (value <= 2) return 'var(--success-600)';      // Green
    if (value === 3) return 'var(--warning-600)';     // Yellow
    if (value === 4) return 'var(--orange-600)';      // Orange
    if (value === 5) return 'var(--danger-600)';      // Red
    if (value === 6) return 'var(--danger-800)';      // Dark Red
    return 'var(--slate-400)';
  };

  const getBiRadsLabel = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `BI-RADS ${value}`;
  };

  const getModalityIcon = (modality: string | null): string => {
    if (!modality) return 'file-text';
    const lower = modality.toLowerCase();
    if (lower.includes('mammo')) return 'activity';
    if (lower.includes('tomo')) return 'trending-up';
    if (lower.includes('ultra')) return 'bar-chart';
    if (lower.includes('mri')) return 'line-chart';
    return 'file-text';
  };

  const getModalityLabel = (modality: string | null): string => {
    if (!modality) return 'Unknown';
    const lower = modality.toLowerCase();
    if (lower.includes('mammo')) return 'Mammography';
    if (lower.includes('tomo')) return 'Tomosynthesis';
    if (lower.includes('ultra')) return 'Ultrasound';
    if (lower.includes('mri')) return 'MRI';
    return modality;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Unknown date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Sort by exam date (oldest to newest)
  const sortedEvents = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      if (!a.exam_date) return 1;
      if (!b.exam_date) return -1;
      return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
    });
    return sorted;
  }, [data]);

  if (isLoading) {
    return (
      <div className="card card-pad" style={{ color: 'var(--fg-3)', textAlign: 'center' }}>
        <p>Loading timeline data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card card-pad" style={{ color: 'var(--danger-700)' }}>
        <p style={{ margin: 0 }}>Failed to load consolidated timeline data.</p>
      </div>
    );
  }

  if (!sortedEvents.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-3)' }}>
        <Icon name="calendar" size={36} />
        <h3 className="t-h3" style={{ marginTop: 12, marginBottom: 8 }}>
          No timeline data available
        </h3>
        <p style={{ color: 'var(--fg-4)', margin: 0 }}>
          Upload multiple reports to see the consolidated timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <h3 className="t-h4" style={{ marginTop: 0, marginBottom: 20 }}>
        Consolidated Timeline
      </h3>

      <div style={{ display: 'grid', gap: 16 }}>
        {sortedEvents.map((event, index) => {
          const biRadsColor = getBiRadsColor(event.birads);
          const isFirstEvent = index === 0;
          const isLastEvent = index === sortedEvents.length - 1;

          return (
            <div
              key={`timeline-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                gap: 16,
                alignItems: 'start',
              }}
            >
              {/* Timeline column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Top connector line */}
                {!isFirstEvent && (
                  <div
                    style={{
                      width: 2,
                      height: 16,
                      background: 'var(--border-1)',
                    }}
                  />
                )}

                {/* Timeline dot - color-coded by BI-RADS */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: biRadsColor,
                    border: '3px solid var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: `0 0 0 3px ${biRadsColor}30`,
                  }}
                  title={getBiRadsLabel(event.birads)}
                >
                  {event.birads !== null ? event.birads : '?'}
                </div>

                {/* Bottom connector line */}
                {!isLastEvent && (
                  <div
                    style={{
                      width: 2,
                      height: 16,
                      background: 'var(--border-1)',
                    }}
                  />
                )}
              </div>

              {/* Event card */}
              <div
                style={{
                  border: '1px solid var(--border-1)',
                  borderRadius: 'var(--r-sm)',
                  padding: 12,
                  background: 'var(--bg-elevated)',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                  marginTop: index === 0 ? 2 : 0,
                }}
              >
                {/* Header row: date and modality */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name={getModalityIcon(event.modality)} size={16} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {formatDate(event.exam_date)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--fg-4)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      background: 'var(--slate-100)',
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {getModalityLabel(event.modality)}
                  </span>
                </div>

                {/* BI-RADS row */}
                <div
                  style={{
                    marginBottom: 8,
                    padding: '8px 10px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--r-xs)',
                    borderLeft: `3px solid ${biRadsColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Assessment</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: biRadsColor,
                      }}
                    >
                      {getBiRadsLabel(event.birads)}
                    </span>
                  </div>
                </div>

                {/* Key change */}
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>
                  {event.key_change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 24,
          padding: 12,
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-4)', marginBottom: 8 }}>
          BI-RADS LEGEND
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 8,
          }}
        >
          {[
            { value: 0, label: '0 - Not assessed' },
            { value: 1, label: '1 - Negative' },
            { value: 2, label: '2 - Benign' },
            { value: 3, label: '3 - Probably benign' },
            { value: 4, label: '4 - Suspicious' },
            { value: 5, label: '5 - Malignant' },
            { value: 6, label: '6 - Known cancer' },
          ].map((item) => (
            <div key={item.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: getBiRadsColor(item.value),
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
