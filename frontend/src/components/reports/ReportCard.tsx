import { Button } from '@/components/ui/Button';
import { BiRads } from '@/components/ui/BiRads';
import { Icon } from '@/components/ui/Icon';
import type { Report } from '@/hooks/useReports';

interface ReportCardProps {
  report: Report;
  onOpenDetail?: (report: Report) => void;
  onOpenPDF?: (report: Report) => void;
  onDelete?: (report: Report) => void;
  isLoadingPDF?: boolean;
  isDeleting?: boolean;
}

const STATUS_COLORS: Record<Report['status'], { text: string; bg: string; border: string }> = {
  pending: { text: 'var(--warning-700)', bg: 'var(--warning-50)', border: 'var(--warning-200)' },
  processing: { text: 'var(--rose-700)', bg: 'var(--rose-50)', border: 'var(--rose-200)' },
  completed: { text: 'var(--success-700)', bg: 'var(--success-50)', border: 'var(--success-200)' },
  failed: { text: 'var(--danger-700)', bg: 'var(--danger-50)', border: 'var(--danger-200)' },
};

export function ReportCard({
  report,
  onOpenDetail,
  onOpenPDF,
  onDelete,
  isLoadingPDF,
  isDeleting,
}: ReportCardProps) {
  const colors = STATUS_COLORS[report.status];
  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const fileSizeStr = report.file_size
    ? `${Math.max(report.file_size / (1024 * 1024), 0.01).toFixed(2)} MB`
    : '';

  return (
    <div
      className="card card-pad"
      style={{
        display: 'grid',
        gap: 16,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onClick={() => onOpenDetail?.(report)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenDetail?.(report);
      }}
      role="button"
      tabIndex={0}
    >
      {/* Header: Filename and Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', wordBreak: 'break-word' }}>
            {report.filename}
          </h4>
          <div className="mono" style={{ color: 'var(--fg-4)', fontSize: 12, marginBottom: 4 }}>
            {formattedDate}
            {fileSizeStr && ` · ${fileSizeStr}`}
          </div>
        </div>
        <div
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--r-pill)',
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            whiteSpace: 'nowrap',
            textTransform: 'capitalize',
          }}
        >
          {report.status}
        </div>
      </div>

      {/* BI-RADS Info (if available) */}
      {report.status === 'completed' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {report.birads_value !== null && report.birads_value !== undefined && (
              <>
                <BiRads value={String(report.birads_value)} />
                <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                  <span style={{ fontWeight: 600 }}>BI-RADS {report.birads_value}</span>
                  {report.birads_confidence && (
                    <span style={{ color: 'var(--fg-3)' }}> • {report.birads_confidence}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {report.summary && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
              {report.summary.slice(0, 120)}
              {report.summary.length > 120 ? '…' : ''}
            </p>
          )}
        </div>
      )}

      {/* Processing/Failed State Info */}
      {report.status === 'processing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)', fontSize: 13 }}>
          <Icon name="Loader2" size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Processing report…
        </div>
      )}

      {report.status === 'failed' && (
        <div style={{ color: 'var(--danger-700)', fontSize: 13 }}>
          Failed to process. Please try uploading again.
        </div>
      )}

      {/* Clinical Disclaimer (if completed) */}
      {report.status === 'completed' && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--r-sm)',
            backgroundColor: 'var(--info-50)',
            borderLeft: '3px solid var(--info-500)',
            fontSize: 12,
            color: 'var(--info-700)',
            lineHeight: 1.4,
          }}
        >
          ⚠️ <strong>Clinical Review Required:</strong> This analysis is AI-generated and must be reviewed by a qualified radiologist.
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          size="sm"
          icon="FileText"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail?.(report);
          }}
        >
          View Details
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={isLoadingPDF ? 'Loader2' : 'ArrowUpRight'}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPDF?.(report);
          }}
          disabled={isLoadingPDF}
        >
          {isLoadingPDF ? 'Opening…' : 'Open PDF'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon="Trash2"
          style={{ color: 'var(--danger-700)', borderColor: 'var(--danger-200)' }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(report);
          }}
          disabled={isDeleting}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
