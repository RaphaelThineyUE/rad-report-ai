import { useMemo, useState } from 'react';
import axios from 'axios';
import { Button, Icon, FileDropzone } from '@/components/ui';
import { api } from '@/lib/api';
import type { UploadReportResponse } from '@/hooks/useReports';

interface BatchUploadDrawerProps {
  patientId: string;
  onClose: () => void;
  onComplete: () => void;
}

type FileStage = 'idle' | 'uploading' | 'extracting' | 'done';

interface FileUploadState {
  file: File;
  stage: FileStage;
  progress: number;
  error: string | null;
}

type Stage = 'idle' | 'uploading' | 'extracting' | 'done';

const STEPS: { id: Stage; label: string; icon: string }[] = [
  { id: 'uploading', label: 'Encrypting & uploading PDFs', icon: 'lock' },
  { id: 'extracting', label: 'Extracting findings with AI', icon: 'sparkles' },
  { id: 'done', label: 'Structured reports ready', icon: 'circle-check' },
];

const STAGE_ORDER: Stage[] = ['uploading', 'extracting', 'done'];

export function BatchUploadDrawer({
  patientId,
  onClose,
  onComplete,
}: BatchUploadDrawerProps) {
  const [fileStates, setFileStates] = useState<Map<string, FileUploadState>>(
    new Map()
  );
  const [stage, setStage] = useState<Stage>('idle');
  const [overallProgress, setOverallProgress] = useState(0);

  const selectedFiles = useMemo(
    () => Array.from(fileStates.values()),
    [fileStates]
  );

  const uploadedCount = useMemo(
    () =>
      selectedFiles.filter((f) => f.stage !== 'idle' && !f.error).length,
    [selectedFiles]
  );

  const failedCount = useMemo(
    () => selectedFiles.filter((f) => f.error !== null).length,
    [selectedFiles]
  );

  const curIdx = STAGE_ORDER.indexOf(stage);

  function handleFilesSelected(files: File[]) {
    if (files.length === 0) {
      setFileStates(new Map());
      return;
    }

    const newStates = new Map(fileStates);
    for (const file of files) {
      if (!newStates.has(file.name)) {
        newStates.set(file.name, {
          file,
          stage: 'idle',
          progress: 0,
          error: null,
        });
      }
    }
    setFileStates(newStates);
  }

  function removeFile(fileName: string) {
    const newStates = new Map(fileStates);
    newStates.delete(fileName);
    setFileStates(newStates);
  }

  async function uploadFiles() {
    if (selectedFiles.length === 0) return;

    setStage('uploading');
    setOverallProgress(0);

    const reportIds: string[] = [];

    const uploadPromises = selectedFiles.map(async (fileState) => {
      const key = fileState.file.name;

      try {
        // Update to uploading state
        setFileStates((prev) => {
          const newMap = new Map(prev);
          const state = newMap.get(key);
          if (state) {
            state.stage = 'uploading';
            state.progress = 0;
          }
          return newMap;
        });

        // Upload file with progress
        const formData = new FormData();
        formData.append('file', fileState.file);
        formData.append('patient_id', patientId);

        const uploadResponse = await api.post<UploadReportResponse>(
          '/api/reports/upload',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
              );
              setFileStates((prev) => {
                const newMap = new Map(prev);
                const state = newMap.get(key);
                if (state) {
                  state.progress = percentCompleted;
                }
                return newMap;
              });
            },
          }
        );

        // Create report entry
        const createResponse = await api.post<{ id: string }>('/api/reports', {
          patient_id: patientId,
          filename: uploadResponse.data.filename,
          file_url: uploadResponse.data.file_url,
          file_size: uploadResponse.data.file_size,
        });

        reportIds.push(createResponse.data.id);

        // Mark as done uploading
        setFileStates((prev) => {
          const newMap = new Map(prev);
          const state = newMap.get(key);
          if (state) {
            state.stage = 'uploading';
            state.progress = 100;
          }
          return newMap;
        });
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data?.error as string | undefined) ??
            'Upload failed'
          : 'Upload failed';

        setFileStates((prev) => {
          const newMap = new Map(prev);
          const state = newMap.get(key);
          if (state) {
            state.error = message;
            state.stage = 'idle';
          }
          return newMap;
        });
      }
    });

    await Promise.all(uploadPromises);

    // Check if all uploaded successfully
    const hasErrors = selectedFiles.some((f) => f.error !== null);
    if (!hasErrors && reportIds.length > 0) {
      setStage('extracting');

      // Process all reports in parallel
      const processPromises = reportIds.map(async (reportId) => {
        try {
          await api.post(`/api/reports/${reportId}/process`);
        } catch (error) {
          console.error(`Failed to process report ${reportId}:`, error);
        }
      });

      await Promise.all(processPromises);
      setStage('done');
      setOverallProgress(100);
    } else {
      setStage('idle');
    }
  }

  async function retryFailedUploads() {
    const failedFiles = selectedFiles.filter((f) => f.error !== null);
    if (failedFiles.length === 0) return;

    // Reset failed files
    setFileStates((prev) => {
      const newMap = new Map(prev);
      failedFiles.forEach((f) => {
        const state = newMap.get(f.file.name);
        if (state) {
          state.error = null;
          state.progress = 0;
        }
      });
      return newMap;
    });

    await uploadFiles();
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside
        className="drawer"
        style={{ width: 520 }}
        role="dialog"
        aria-label="Batch upload reports"
      >
        <div className="drawer-head">
          <div>
            <h2 className="t-h3" style={{ margin: 0 }}>
              Upload reports
            </h2>
            <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 3 }}>
              Batch secure PDF → AI extraction
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{ border: 'none' }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {stage === 'idle' && selectedFiles.length === 0 && (
            <FileDropzone
              accept="application/pdf"
              multiple={true}
              onFilesSelected={handleFilesSelected}
            />
          )}

          {selectedFiles.length > 0 && (
            <div>
              {/* File list */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div className="t-h4" style={{ margin: 0 }}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}{' '}
                    selected
                  </div>
                  {stage === 'idle' && (
                    <button
                      onClick={() => handleFilesSelected([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--fg-3)',
                        cursor: 'pointer',
                        fontSize: 12,
                        textDecoration: 'underline',
                      }}
                    >
                      Add more
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                  {selectedFiles.map((fileState) => (
                    <div
                      key={fileState.file.name}
                      style={{
                        border: '1px solid var(--border-2)',
                        borderRadius: 'var(--r-md)',
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <Icon name="file-text" size={16} color="var(--rose-600)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fileState.file.name}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 11, color: 'var(--fg-4)' }}
                          >
                            {(fileState.file.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>

                        {fileState.error ? (
                          <Icon name="alert-circle" size={16} color="var(--danger-600)" />
                        ) : fileState.stage === 'done' ? (
                          <Icon
                            name="circle-check"
                            size={16}
                            color="var(--success-500)"
                          />
                        ) : fileState.stage === 'uploading' ? (
                          <Icon
                            name="loader"
                            size={16}
                            color="var(--rose-600)"
                            style={{ animation: 'spin .9s linear infinite' }}
                          />
                        ) : (
                          <button
                            onClick={() => removeFile(fileState.file.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--fg-3)',
                              padding: 0,
                            }}
                          >
                            <Icon name="x" size={16} />
                          </button>
                        )}
                      </div>

                      {fileState.error && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--danger-600)',
                            marginBottom: 8,
                            padding: '4px 8px',
                            background: 'var(--danger-50)',
                            borderRadius: 'var(--r-sm)',
                          }}
                        >
                          {fileState.error}
                        </div>
                      )}

                      {fileState.stage === 'uploading' && fileState.progress > 0 && (
                        <div
                          style={{
                            background: 'var(--border-2)',
                            borderRadius: 'var(--r-sm)',
                            height: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              background: 'var(--rose-600)',
                              height: '100%',
                              width: `${fileState.progress}%`,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall progress during extraction */}
                {stage === 'extracting' && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '12px 14px',
                      background: 'var(--rose-50)',
                      borderRadius: 'var(--r-md)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--rose-700)',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Icon
                        name="loader"
                        size={14}
                        style={{ animation: 'spin .9s linear infinite' }}
                      />
                      Extracting findings...
                    </div>
                    <div
                      style={{
                        background: 'var(--rose-200)',
                        borderRadius: 'var(--r-sm)',
                        height: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          background: 'var(--rose-600)',
                          height: '100%',
                          width: `${overallProgress}%`,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Progress steps */}
              {stage !== 'idle' && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: '16px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {STEPS.map((s, i) => {
                      const done = stage === 'done' ? i <= curIdx : i < curIdx;
                      const activeNow = i === curIdx && stage !== 'done';
                      return (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            opacity: i <= curIdx ? 1 : 0.4,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: done
                                ? 'var(--success-50)'
                                : activeNow
                                  ? 'var(--rose-50)'
                                  : 'var(--slate-100)',
                              color: done
                                ? 'var(--success-500)'
                                : activeNow
                                  ? 'var(--rose-600)'
                                  : 'var(--fg-4)',
                            }}
                          >
                            {done ? (
                              <Icon name="check" size={14} />
                            ) : activeNow ? (
                              <Icon
                                name="loader"
                                size={14}
                                style={{ animation: 'spin .9s linear infinite' }}
                              />
                            ) : (
                              <Icon name={s.icon} size={13} />
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: done || activeNow ? 600 : 500,
                              color:
                                done || activeNow ? 'var(--fg-1)' : 'var(--fg-3)',
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary after completion */}
              {stage === 'done' && (
                <div
                  className="fade-up"
                  style={{
                    padding: 16,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-rose-tint)',
                    border: '1px solid var(--rose-200)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Icon name="sparkles" size={16} color="var(--rose-600)" />
                    <span
                      className="t-overline"
                      style={{ color: 'var(--rose-700)' }}
                    >
                      {uploadedCount} report{uploadedCount !== 1 ? 's' : ''} extracted
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--fg-3)',
                    }}
                  >
                    All reports have been processed and are ready for review.
                  </p>
                </div>
              )}

              {/* Error summary */}
              {failedCount > 0 && stage === 'idle' && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--danger-50)',
                    border: '1px solid var(--danger-200)',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Icon name="alert-circle" size={14} color="var(--danger-600)" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger-700)' }}>
                      {failedCount} file{failedCount !== 1 ? 's' : ''} failed to upload
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <Button variant="secondary" onClick={onClose}>
            {stage === 'done' ? 'Done' : 'Cancel'}
          </Button>

          {stage !== 'done' && selectedFiles.length > 0 && failedCount > 0 && (
            <Button icon="upload" onClick={retryFailedUploads}>
              Retry Failed
            </Button>
          )}

          {stage === 'idle' && selectedFiles.length > 0 && failedCount === 0 && (
            <Button icon="upload" onClick={uploadFiles}>
              Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
          )}

          {stage === 'done' && (
            <Button icon="arrow-up-right" onClick={onComplete}>
              View Reports
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
