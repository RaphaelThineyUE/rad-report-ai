/**
 * Report detail view.
 * Two rendering modes controlled by the `inline` prop:
 *   - inline=false (default): fixed right-side slide-over with its own overlay. Use when
 *     opening outside a modal context.
 *   - inline=true: renders as a plain block inside the caller's scrollable container (no
 *     overlay, no fixed position). Use when nested inside PatientDetail to avoid z-index
 *     conflicts with the parent modal.
 * Content is delegated to ReportDetailContent.
 */
import { Button } from '@/components/ui/Button';
import { useReports } from '@/hooks/useReports';
import { useBiRadsTrend } from '@/hooks/useBiRadsTrend';
import { useExportReport } from '@/hooks/useExport';
import { ReportDetailContent } from './ReportDetailContent';
import type { Report } from '@/hooks/useReports';

interface ReportDetailProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPDF?: (report: Report) => void;
  isLoadingPDF?: boolean;
  patientId?: string;
  inline?: boolean;
}

export function ReportDetail({ report, isOpen, onClose, onOpenPDF, isLoadingPDF, patientId, inline = false }: ReportDetailProps) {
  if (!isOpen || !report) return null;

  const { data: allReports } = useReports(patientId);
  const biRadsTrendData = useBiRadsTrend(allReports);
  const exportReport = useExportReport();

  const content = <ReportDetailContent report={report} biRadsTrendData={biRadsTrendData} />;

  const footer = (
    <div style={{ display: 'flex', gap: 8, paddingTop: inline ? 20 : 0 }}>
      <Button variant="secondary" style={{ flex: 1 }} icon="Download" onClick={() => exportReport(report.id)}>
        Export
      </Button>
      <Button
        variant="secondary"
        style={{ flex: 1 }}
        icon={isLoadingPDF ? 'Loader2' : 'ArrowUpRight'}
        onClick={() => onOpenPDF?.(report)}
        disabled={isLoadingPDF}
      >
        {isLoadingPDF ? 'Opening…' : 'Open PDF'}
      </Button>
      {!inline && (
        <Button variant="primary" style={{ flex: 1 }} onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );

  if (inline) {
    return (
      <div>
        {/* Back navigation header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-1)' }}>
          <Button variant="ghost" size="sm" icon="ArrowLeft" onClick={onClose} />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>{report.filename}</span>
        </div>
        {content}
        {footer}
      </div>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
      <div
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0,
          width: Math.min(500, window.innerWidth * 0.9),
          backgroundColor: 'var(--bg-1)',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Report Details</h2>
          <Button variant="ghost" size="sm" icon="X" onClick={onClose} style={{ color: 'var(--fg-3)' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>{content}</div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-1)' }}>{footer}</div>
      </div>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
