/**
 * Test harness page for data extraction improvement.
 * Upload a PDF to test the full OCR → de-identification → AI extraction pipeline.
 */
import { useState, useRef } from 'react';
import axios from 'axios';
import type { RadiologyReport } from '@/../../shared/types';
import { api } from '@/lib/api';

interface ExtractionResult {
  analysis: Partial<RadiologyReport>;
  original_text_length: number;
  extracted_text: string;
  processing_time_ms?: number;
}

interface ErrorInfo {
  title: string;
  details?: string;
  stage?: 'extraction' | 'analysis';
}

interface ComparisonRun {
  id: string;
  result: ExtractionResult;
  filename: string;
  prompt_variant: string;
  model: string;
  temperature: number;
  timestamp: Date;
}

const PARAM_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  prompt_variant: {
    label: 'Prompt Variant',
    description:
      'Controls how the AI interprets ambiguous fields. Default balances precision and recall. Strict only extracts high-confidence values (fewer fields, less guessing). Lenient extracts everything it can, including low-confidence inferences.',
  },
  model: {
    label: 'Model',
    description:
      'The Claude model used for extraction. Sonnet is the best balance of speed and accuracy. Opus is the most capable and thorough but slower. Haiku is the fastest and cheapest, suited for simple reports.',
  },
  temperature: {
    label: 'Temperature',
    description:
      'Controls how deterministic the AI output is. 0 = fully deterministic (same output every time, best for structured extraction). 1 = more creative/varied (useful for free-text summaries). For clinical extraction, keep this at 0–0.3.',
  },
};

export default function Test() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [comparisonRuns, setComparisonRuns] = useState<ComparisonRun[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [promptVariant, setPromptVariant] = useState<'default' | 'strict' | 'lenient'>('default');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [temperature, setTemperature] = useState(0.2);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setError(null);
    } else {
      setError({ title: 'Only PDF files are supported' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError({ title: 'Please select a PDF file to analyze' });
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt_variant', promptVariant);
      formData.append('model', model);
      formData.append('temperature', String(temperature));

      const response = await api.post<ExtractionResult>('/api/test/analyze-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result: ExtractionResult = {
        ...response.data,
        processing_time_ms: Date.now() - startTime,
      };

      setCurrentResult(result);
      setExtractedText(result.extracted_text);
      setComparisonRuns(prev => [
        ...prev,
        {
          id: `run-${Date.now()}`,
          result,
          filename: file.name,
          prompt_variant: promptVariant,
          model,
          temperature,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setCurrentResult(null);

      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | { error?: string; details?: string; stage?: 'extraction' | 'analysis'; extracted_text?: string }
          | undefined;

        setExtractedText(data?.extracted_text ?? null);

        if (data?.error) {
          setError({ title: data.error, details: data.details, stage: data.stage });
        } else if (err.response) {
          setError({ title: `Request failed (HTTP ${err.response.status})`, details: err.message });
        } else if (err.request) {
          setError({ title: 'Could not reach the server', details: 'Check your connection and that the backend is running.' });
        } else {
          setError({ title: err.message });
        }
      } else {
        setExtractedText(null);
        setError({ title: err instanceof Error ? err.message : 'Analysis failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (result: ExtractionResult): number => {
    const a = result.analysis;
    const fields = [a.birads_value, a.exam_date, a.modality, a.findings?.length, a.recommendations?.length];
    return Math.round((fields.filter(f => f !== null && f !== undefined && f !== 0).length / fields.length) * 100);
  };

  const getValidationStatus = (value: unknown): 'valid' | 'missing' | 'empty' => {
    if (value === null || value === undefined) return 'missing';
    if (Array.isArray(value) && value.length === 0) return 'empty';
    if (typeof value === 'string' && value.trim() === '') return 'empty';
    return 'valid';
  };

  const ParamRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const open = expandedParam === id;
    const info = PARAM_DESCRIPTIONS[id];
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>{info.label}</label>
          <button
            onClick={() => setExpandedParam(open ? null : id)}
            style={{ fontSize: 11, color: 'var(--fg-4)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
            title="What does this do?"
          >
            {open ? '▲ less' : '? what is this'}
          </button>
        </div>
        {open && (
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', background: 'var(--slate-50)', border: '1px solid var(--border-2)', borderRadius: 6, padding: '8px 10px', marginBottom: 8, lineHeight: 1.5 }}>
            {info.description}
          </div>
        )}
        {children}
      </div>
    );
  };

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Extraction Test Harness</h1>
          <div className="sub">Upload a PDF to test the full OCR → de-identification → AI extraction pipeline</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* Input & Controls */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Upload Report PDF</h3>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--rose-500)' : file ? 'var(--success-500)' : 'var(--slate-300)'}`,
              borderRadius: 8,
              padding: '32px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--rose-50)' : file ? 'var(--success-50)' : 'var(--slate-50)',
              marginBottom: 16,
              transition: 'all 0.15s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {file ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--success-700)' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB · click to change
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>☁️</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg-2)' }}>Drop a PDF here</div>
                <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>or click to browse</div>
              </>
            )}
          </div>

          <ParamRow id="prompt_variant">
            <select
              value={promptVariant}
              onChange={e => setPromptVariant(e.target.value as typeof promptVariant)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--slate-300)', borderRadius: 6 }}
            >
              <option value="default">Default</option>
              <option value="strict">Strict (higher confidence)</option>
              <option value="lenient">Lenient (more comprehensive)</option>
            </select>
          </ParamRow>

          <ParamRow id="model">
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--slate-300)', borderRadius: 6 }}
            >
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (recommended)</option>
              <option value="claude-opus-4-8">Claude Opus 4.8 (most capable)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fastest)</option>
            </select>
          </ParamRow>

          <ParamRow id="temperature">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>
                {temperature.toFixed(1)}
              </span>
            </div>
          </ParamRow>

          <button
            onClick={handleAnalyze}
            disabled={loading || !file}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: 14,
              padding: '12px 16px',
              opacity: loading || !file ? 0.5 : 1,
              cursor: loading || !file ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Analyzing…' : '▶ Analyze PDF'}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--danger-50)', border: '1px solid var(--danger-500)', borderRadius: 6, fontSize: 12, color: 'var(--danger-700)' }}>
              <div style={{ fontWeight: 600 }}>{error.title}</div>
              {error.details && (
                <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {error.details}
                </div>
              )}
              {error.stage === 'analysis' && extractedText && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  Text extraction succeeded — see the "Extracted Text" panel for the raw OCR output.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Extraction Results</h3>

          {currentResult ? (
            <>
              <div style={{ padding: 12, background: 'var(--slate-50)', borderRadius: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Field completion</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{calculateCompletion(currentResult)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--slate-200)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${calculateCompletion(currentResult)}%`, background: 'var(--rose-500)' }} />
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                  <span>Time: {currentResult.processing_time_ms}ms</span>
                  <span>Extracted: {currentResult.original_text_length} chars</span>
                </div>
              </div>

              <div style={{ maxHeight: 340, overflow: 'auto' }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Key Fields</h4>
                {[
                  { key: 'birads_value', label: 'BI-RADS', value: currentResult.analysis.birads_value },
                  { key: 'exam_date', label: 'Exam Date', value: currentResult.analysis.exam_date },
                  { key: 'modality', label: 'Modality', value: currentResult.analysis.modality },
                  { key: 'findings', label: 'Findings', value: currentResult.analysis.findings?.length ?? 0 },
                  { key: 'recommendations', label: 'Recommendations', value: currentResult.analysis.recommendations?.length ?? 0 },
                ].map(({ key, label, value }) => {
                  const status = getValidationStatus(value);
                  const colors = {
                    valid:   { bg: 'var(--success-50)',  border: 'var(--success-500)',  text: 'var(--success-700)' },
                    empty:   { bg: 'var(--warning-50)',  border: 'var(--warning-500)',  text: 'var(--warning-700)' },
                    missing: { bg: 'var(--danger-50)',   border: 'var(--danger-500)',   text: 'var(--danger-700)' },
                  }[status];
                  return (
                    <div key={key} style={{ padding: 8, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 4, marginBottom: 6, fontSize: 11 }}>
                      <div style={{ fontWeight: 600, color: colors.text, marginBottom: 2 }}>{label}</div>
                      <div style={{ color: colors.text, fontSize: 10 }}>
                        {value !== null && value !== undefined ? String(value) : `[${status.toUpperCase()}]`}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => comparisonRuns.length >= 2 && setCompareMode(!compareMode)}
                disabled={comparisonRuns.length < 2}
                style={{
                  marginTop: 12, width: '100%', padding: '8px 12px',
                  background: comparisonRuns.length >= 2 ? 'var(--slate-500)' : 'var(--slate-200)',
                  color: 'white', border: 'none', borderRadius: 6, fontSize: 12,
                  cursor: comparisonRuns.length >= 2 ? 'pointer' : 'not-allowed',
                }}
              >
                {compareMode ? 'Hide Comparison' : 'Compare Runs'} ({comparisonRuns.length})
              </button>
            </>
          ) : (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>
              {loading ? 'Analyzing…' : 'Run an analysis to see extracted fields.'}
            </div>
          )}
        </div>

        {/* Extracted Text */}
        <div className="card card-pad">
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Extracted Text</h3>

          {extractedText ? (
            <>
              <div style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 8 }}>
                {extractedText.length.toLocaleString()} characters (raw OCR / pdf-parse output, before de-identification)
              </div>
              <pre style={{
                fontSize: 11, lineHeight: 1.5, color: 'var(--fg-2)',
                background: 'var(--slate-50)', border: '1px solid var(--border-1)', borderRadius: 6,
                padding: 12, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 480, margin: 0,
              }}>
                {extractedText}
              </pre>
            </>
          ) : (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>
              {loading ? 'Extracting text…' : 'OCR output will appear here after you analyze a PDF.'}
            </div>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {compareMode && comparisonRuns.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Comparison: {comparisonRuns.length} runs</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
                    {['Run', 'File', 'Prompt', 'Model', 'Temp', 'Completion', 'Time', 'BI-RADS', 'Findings'].map(h => (
                      <th key={h} style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRuns.map((run, idx) => (
                    <tr key={run.id} style={{ borderBottom: '1px solid var(--slate-100)', background: idx % 2 === 0 ? 'transparent' : 'var(--slate-50)' }}>
                      <td style={{ padding: 8 }}>{idx + 1}</td>
                      <td style={{ padding: 8, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.filename}</td>
                      <td style={{ padding: 8 }}>{run.prompt_variant}</td>
                      <td style={{ padding: 8 }}>{run.model.split('-').slice(1, 3).join('-')}</td>
                      <td style={{ padding: 8 }}>{run.temperature.toFixed(1)}</td>
                      <td style={{ padding: 8, fontWeight: 600 }}>{calculateCompletion(run.result)}%</td>
                      <td style={{ padding: 8 }}>{run.result.processing_time_ms}ms</td>
                      <td style={{ padding: 8 }}>{run.result.analysis.birads_value ?? '—'}</td>
                      <td style={{ padding: 8 }}>{run.result.analysis.findings?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
