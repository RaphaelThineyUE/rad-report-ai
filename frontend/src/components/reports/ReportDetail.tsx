import { Button } from '@/components/ui/Button';
import { BiRads } from '@/components/ui/BiRads';
import { BiRadsTrendSparkline } from '@/components/analytics';
import { useReports } from '@/hooks/useReports';
import { useBiRadsTrend } from '@/hooks/useBiRadsTrend';
import type { Report } from '@/hooks/useReports';

interface ReportDetailProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPDF?: (report: Report) => void;
  isLoadingPDF?: boolean;
  patientId?: string;
}

export function ReportDetail({ report, isOpen, onClose, onOpenPDF, isLoadingPDF, patientId }: ReportDetailProps) {
  if (!isOpen || !report) return null;

  const { data: allReports } = useReports(patientId);
  const biRadsTrendData = useBiRadsTrend(allReports);

  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fileSizeStr = report.file_size
    ? `${Math.max(report.file_size / (1024 * 1024), 0.01).toFixed(2)} MB`
    : 'Unknown';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      {/* Slide-over Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: Math.min(500, window.innerWidth * 0.9),
          backgroundColor: 'var(--bg-1)',
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Report Details</h2>
          <Button
            variant="ghost"
            size="sm"
            icon="X"
            onClick={onClose}
            style={{ color: 'var(--fg-3)' }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gap: 20 }}>
          {/* BI-RADS Trend (if 2+ reports) */}
          {biRadsTrendData.length >= 2 && (
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                BI-RADS Trend
              </h3>
              <div style={{ height: 60 }}>
                <BiRadsTrendSparkline data={biRadsTrendData} size="md" />
              </div>
            </div>
          )}

          {/* File Information */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
              File Information
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 2 }}>Filename</div>
                <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-word' }}>
                  {report.filename}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 2 }}>Uploaded</div>
                <div style={{ fontSize: 13 }}>{formattedDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 2 }}>File Size</div>
                <div style={{ fontSize: 13 }}>{fileSizeStr}</div>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
              Processing Status
            </h3>
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--r-sm)',
                backgroundColor:
                  report.status === 'completed'
                    ? 'var(--success-50)'
                    : report.status === 'processing'
                      ? 'var(--warning-50)'
                      : report.status === 'failed'
                        ? 'var(--danger-50)'
                        : 'var(--fg-4)',
                color:
                  report.status === 'completed'
                    ? 'var(--success-700)'
                    : report.status === 'processing'
                      ? 'var(--warning-700)'
                      : report.status === 'failed'
                        ? 'var(--danger-700)'
                        : 'var(--fg-2)',
              }}
            >
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{report.status}</div>
              {report.processing_time_ms && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Processing time: {(report.processing_time_ms / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          </div>

          {/* Analysis Results (if completed) */}
          {report.status === 'completed' && (
            <>
              {/* BI-RADS Assessment */}
              {report.birads_value !== null && report.birads_value !== undefined && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                    BI-RADS Assessment
                  </h3>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <BiRads value={String(report.birads_value)} size="lg" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>BI-RADS {report.birads_value}</div>
                      {report.birads_confidence && (
                        <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                          Confidence: {report.birads_confidence}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {report.summary && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                    Summary
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--fg-2)' }}>
                    {report.summary}
                  </p>
                </div>
              )}

              {/* Breast Density */}
              {report.breast_density_value && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                    Breast Density
                  </h3>
                  <div style={{ fontSize: 13 }}>{report.breast_density_value}</div>
                </div>
              )}

              {/* Exam Details */}
              {(report.exam_type || report.exam_laterality) && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
                    Exam Details
                  </h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {report.exam_type && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 2 }}>Type</div>
                        <div style={{ fontSize: 13, textTransform: 'capitalize' }}>{report.exam_type}</div>
                      </div>
                    )}
                    {report.exam_laterality && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 2 }}>Laterality</div>
                        <div style={{ fontSize: 13, textTransform: 'capitalize' }}>
                          {report.exam_laterality}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {report.red_flags && report.red_flags.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--danger-700)' }}>
                    🚨 Red Flags
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--fg-2)', fontSize: 13 }}>
                    {report.red_flags.map((flag, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clinical Disclaimer */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--r-sm)',
                  backgroundColor: 'var(--info-50)',
                  borderLeft: '3px solid var(--info-500)',
                  color: 'var(--info-700)',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                <strong>⚠️ Clinical Review Required</strong>
                <p style={{ margin: '6px 0 0 0' }}>
                  This analysis is AI-generated and must be reviewed by a qualified radiologist before
                  clinical use. Do not rely solely on this analysis for diagnosis.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-1)',
            display: 'flex',
            gap: 8,
          }}
        >
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            icon={isLoadingPDF ? 'Loader2' : 'ArrowUpRight'}
            onClick={() => onOpenPDF?.(report)}
            disabled={isLoadingPDF}
          >
            {isLoadingPDF ? 'Opening…' : 'Open PDF'}
          </Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
