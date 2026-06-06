/**
 * Tab panel for a patient's radiology reports within PatientDetail.
 * Props: patientId (string), patientName? (string).
 * Lists uploaded reports as ReportCards with full CRUD via useReports hooks.
 * Supports PDF upload (multi-file), signed-URL PDF open, delete, and a
 * "Compare Reports" ConsolidatedView modal (visible when 2+ reports exist).
 * Shows BiRadsTrendSparkline when 2+ completed reports are available.
 */
import { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ConsolidatedView, BiRadsTrendSparkline } from '@/components/analytics';
import { ReportCard, ReportDetail } from '@/components/reports';
import {
  useCreateReport,
  useDeleteReport,
  useReports,
  useReportSignedUrl,
  type Report,
  type UploadReportResponse,
} from '@/hooks/useReports';
import { useBiRadsTrend } from '@/hooks/useBiRadsTrend';
import { api } from '@/lib/api';

interface ReportsTabProps {
  patientId: string;
  patientName?: string;
}


export function ReportsTab({ patientId, patientName }: ReportsTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: reports, isLoading, isError } = useReports(patientId);
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();
  const signedUrl = useReportSignedUrl();
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const sortedReports = useMemo(() => reports ?? [], [reports]);
  const biRadsTrendData = useBiRadsTrend(reports);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setErrorMessage(null);
    setUploading(true);

    try {
      for (const file of Array.from(selected)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', patientId);

        const uploadResponse = await api.post<UploadReportResponse>('/api/reports/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        await createReport.mutateAsync({
          patient_id: patientId,
          filename: uploadResponse.data.filename,
          file_url: uploadResponse.data.file_url,
          file_size: uploadResponse.data.file_size,
        });
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error as string | undefined) ?? 'Failed to upload reports'
        : 'Failed to upload reports';
      setErrorMessage(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleOpenReport(report: Report) {
    try {
      const data = await signedUrl.mutateAsync(report.id);
      window.open(data.signed_url, '_blank', 'noopener,noreferrer');
    } catch {
      setErrorMessage('Failed to open report');
    }
  }

  async function handleDeleteReport(report: Report) {
    try {
      await deleteReport.mutateAsync({ id: report.id, patientId });
    } catch {
      setErrorMessage('Failed to delete report');
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 className="t-h4" style={{ margin: 0, marginBottom: 6 }}>Radiology Reports</h3>
            <p style={{ margin: 0, color: 'var(--fg-3)', fontSize: 13 }}>
              Upload one or more PDFs. Duplicate filenames per patient are blocked.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sortedReports.length > 1 && (
              <Button
                variant="secondary"
                icon="file-text"
                onClick={() => setShowConsolidated(true)}
              >
                Compare Reports
              </Button>
            )}
            <Button variant="primary" icon={uploading ? 'Loader2' : 'upload'} onClick={openPicker} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload PDF(s)'}
            </Button>
          </div>
        </div>
      </div>

      {biRadsTrendData.length >= 2 && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <h4 className="t-h4" style={{ margin: '0 0 12px 0', fontSize: 14 }}>BI-RADS Trend</h4>
          <BiRadsTrendSparkline data={biRadsTrendData} size="md" />
        </div>
      )}

      {errorMessage && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--danger-50)', color: 'var(--danger-700)' }}>
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="card card-pad" style={{ color: 'var(--fg-3)' }}>Loading reports…</div>
      ) : isError ? (
        <div className="card card-pad" style={{ color: 'var(--danger-700)' }}>Failed to load reports.</div>
      ) : !sortedReports.length ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-3)' }}>
          <Icon name="FileText" size={36} />
          <h3 className="t-h3" style={{ marginTop: 12, marginBottom: 8 }}>No reports yet</h3>
          <p style={{ color: 'var(--fg-4)', margin: 0 }}>Upload the first report to start building the patient history.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {sortedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onOpenDetail={setSelectedReport}
              onOpenPDF={handleOpenReport}
              onDelete={handleDeleteReport}
              isLoadingPDF={signedUrl.isPending}
              isDeleting={deleteReport.isPending}
            />
          ))}
        </div>
      )}

      {showConsolidated && reports && patientName && (
        <ConsolidatedView
          patientId={patientId}
          patientName={patientName}
          reports={reports}
          onClose={() => setShowConsolidated(false)}
        />
      )}

      <ReportDetail
        report={selectedReport}
        isOpen={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
        onOpenPDF={handleOpenReport}
        isLoadingPDF={signedUrl.isPending}
        patientId={patientId}
      />
    </div>
  );
}
