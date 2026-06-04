import { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  useCreateReport,
  useDeleteReport,
  useReports,
  useReportSignedUrl,
  type Report,
  type ReportStatus,
  type UploadReportResponse,
} from '@/hooks/useReports';
import { api } from '@/lib/api';

interface ReportsTabProps {
  patientId: string;
}

const STATUS_COLORS: Record<ReportStatus, React.CSSProperties> = {
  pending: { color: 'var(--warning-700)', background: 'var(--warning-50)', borderColor: '#f6e2b3' },
  processing: { color: 'var(--rose-700)', background: 'var(--rose-50)', borderColor: 'var(--rose-200)' },
  completed: { color: 'var(--success-700)', background: 'var(--success-50)', borderColor: 'var(--success-200)' },
  failed: { color: 'var(--danger-700)', background: 'var(--danger-50)', borderColor: 'var(--danger-200)' },
};

export function ReportsTab({ patientId }: ReportsTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: reports, isLoading, isError } = useReports(patientId);
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();
  const signedUrl = useReportSignedUrl();
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedReports = useMemo(() => reports ?? [], [reports]);

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
          <Button variant="primary" icon={uploading ? 'Loader2' : 'upload'} onClick={openPicker} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload PDF(s)'}
          </Button>
        </div>
      </div>

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
            <div key={report.id} className="card card-pad" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--fg-1)', wordBreak: 'break-word' }}>{report.filename}</div>
                  <div className="mono" style={{ color: 'var(--fg-4)', fontSize: 12 }}>
                    Added {report.created_at.slice(0, 10)}
                    {report.file_size ? ` · ${Math.max(report.file_size / (1024 * 1024), 0.01).toFixed(2)} MB` : ''}
                  </div>
                </div>
                <span style={{ border: '1px solid', borderRadius: 'var(--r-pill)', padding: '2px 10px', fontSize: 12, fontWeight: 600, ...STATUS_COLORS[report.status] }}>
                  {report.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={signedUrl.isPending ? 'Loader2' : 'arrow-up-right'}
                  onClick={() => {
                    void handleOpenReport(report);
                  }}
                  disabled={signedUrl.isPending}
                >
                  Open PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="Trash2"
                  style={{ color: 'var(--danger-700)', borderColor: 'var(--danger-200)' }}
                  onClick={() => {
                    void handleDeleteReport(report);
                  }}
                  disabled={deleteReport.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
