import { useMemo, useState } from 'react';
import { Avatar, Button, Icon, BiRads } from '@/components/ui';
import { ComparisonChart, type ComparisonDataPoint } from './ComparisonChart';
import { MetricsGrid, type MetricItem } from './MetricsGrid';
import type { Report } from '@/hooks/useReports';

interface ConsolidatedViewProps {
  patientId: string;
  patientName: string;
  reports: Report[];
  onClose: () => void;
}

/**
 * Modal component for consolidated multi-report comparison per patient.
 * Displays:
 * - Key metrics from all reports
 * - BI-RADS value trends
 * - Comparison charts for findings
 * - Date range filtering
 * - Longitudinal analysis across studies
 */
export function ConsolidatedView({ patientId, patientName, reports, onClose }: ConsolidatedViewProps) {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const filteredReports = useMemo(() => {
    let filtered = [...reports].filter(r => r.status === 'completed');

    if (dateRange.start) {
      filtered = filtered.filter(r => r.created_at >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => r.created_at <= dateRange.end);
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports, dateRange]);

  const metrics = useMemo(() => {
    const items: MetricItem[] = [
      {
        label: 'Total Reports',
        value: filteredReports.length,
        icon: 'file-text',
        color: 'rose',
      },
      {
        label: 'Average BI-RADS',
        value: filteredReports.length
          ? (
              filteredReports.reduce((sum, r) => sum + (r.birads_value || 0), 0) / filteredReports.length
            ).toFixed(1)
          : '—',
        icon: 'bar-chart',
        color: 'info',
      },
      {
        label: 'Completed',
        value: filteredReports.filter(r => r.status === 'completed').length,
        icon: 'circle-check',
        color: 'success',
      },
      {
        label: 'Latest BI-RADS',
        value: filteredReports[0]?.birads_value || '—',
        icon: 'trending-up',
        color: 'warning',
      },
    ];

    return items;
  }, [filteredReports]);

  useMemo(() => {
    // Future use: comparison data for multi-metric charts
    const _comparisonData: ComparisonDataPoint[] = filteredReports.map((r, idx) => ({
      date: r.created_at,
      label: `Report ${filteredReports.length - idx}`,
      'BI-RADS': r.birads_value || 0,
      'Summary Length': (r.summary || '').length,
    }));
    return _comparisonData;
  }, [filteredReports]);

  const biRadsChartData = useMemo(() => {
    return filteredReports
      .filter(r => r.birads_value !== null)
      .map((r) => ({
        date: r.created_at,
        label: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        'BI-RADS': r.birads_value as number,
      }));
  }, [filteredReports]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        className="modal"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: 'var(--r-lg)',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <Avatar
              initials={patientName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
              size={42}
            />
            <div style={{ minWidth: 0 }}>
              <h2 className="t-h3" style={{ margin: 0, marginBottom: 4 }}>
                {patientName}
              </h2>
              <div className="mono" style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                {patientId} · {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
              </div>
            </div>
            {filteredReports.length > 0 && filteredReports[0]?.birads_value && (
              <BiRads value={filteredReports[0].birads_value.toString()} size="md" />
            )}
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'grid',
            gap: 24,
          }}
        >
          {/* Date Range Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="t-overline" style={{ fontSize: 11 }}>
                From
              </span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{
                  padding: '9px 12px',
                  fontSize: 14,
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border-2)',
                  background: 'var(--bg-surface)',
                  color: 'var(--fg-1)',
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span className="t-overline" style={{ fontSize: 11 }}>
                To
              </span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{
                  padding: '9px 12px',
                  fontSize: 14,
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border-2)',
                  background: 'var(--bg-surface)',
                  color: 'var(--fg-1)',
                }}
              />
            </label>
          </div>

          {/* Key Metrics */}
          {filteredReports.length > 0 && (
            <>
              <div>
                <span className="t-overline" style={{ marginBottom: 12, display: 'block' }}>
                  Key Metrics
                </span>
                <MetricsGrid metrics={metrics} />
              </div>

              {/* BI-RADS Trend Chart */}
              <div className="card card-pad">
                <ComparisonChart
                  data={biRadsChartData}
                  series={[{ key: 'BI-RADS', label: 'BI-RADS Rating', color: 'var(--rose-600)' }]}
                  type="line"
                  title="BI-RADS Trend Over Time"
                  height={280}
                />
              </div>

              {/* Detailed Report List */}
              <div>
                <span className="t-overline" style={{ marginBottom: 12, display: 'block' }}>
                  Report Details
                </span>
                <div style={{ display: 'grid', gap: 12 }}>
                  {filteredReports.map((report, idx) => (
                    <div key={report.id} className="card card-pad">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--fg-1)', marginBottom: 4 }}>
                            Report {filteredReports.length - idx}
                          </div>
                          <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 8 }}>
                            {new Date(report.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {report.summary && (
                            <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                              {report.summary.slice(0, 150)}
                              {report.summary.length > 150 ? '…' : ''}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          {report.birads_value && (
                            <BiRads value={report.birads_value.toString()} size="sm" />
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: 'var(--r-sm)',
                              background: report.status === 'completed' ? 'var(--success-50)' : 'var(--warning-50)',
                              color: report.status === 'completed' ? 'var(--success-700)' : 'var(--warning-700)',
                            }}
                          >
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {filteredReports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--fg-3)' }}>
              <Icon name="file-text" size={36} style={{ opacity: 0.5, marginBottom: 12 }} />
              <p>No completed reports in the selected date range.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 24px',
            borderTop: '1px solid var(--border-1)',
            background: 'var(--bg-subtle)',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
