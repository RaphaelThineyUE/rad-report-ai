/**
 * Test harness page for data extraction improvement
 * Admin-only page for testing and tweaking AI extraction capabilities
 */
import { useState } from 'react';
import type { RadiologyReport } from '@/../../shared/types';
import { api } from '@/lib/api';

interface ExtractionResult {
  analysis: Partial<RadiologyReport>;
  original_text_length: number;
  processing_time_ms?: number;
}

interface ComparisonRun {
  id: string;
  result: ExtractionResult;
  prompt_variant: string;
  model: string;
  temperature: number;
  timestamp: Date;
}

export default function Test() {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [comparisonRuns, setComparisonRuns] = useState<ComparisonRun[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Extraction params
  const [promptVariant, setPromptVariant] = useState<'default' | 'strict' | 'lenient'>('default');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [temperature, setTemperature] = useState(0.7);

  const handleAnalyze = async () => {
    if (!reportText.trim()) {
      setError('Please paste a report to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await api.post<ExtractionResult>('/api/test/analyze', {
        report_text: reportText,
        prompt_variant: promptVariant as 'default' | 'strict' | 'lenient',
        model,
        temperature,
      });

      const result: ExtractionResult = {
        ...response.data,
        processing_time_ms: Date.now() - startTime,
      };

      setCurrentResult(result);

      // Add to comparison runs
      const newRun: ComparisonRun = {
        id: `run-${Date.now()}`,
        result,
        prompt_variant: promptVariant,
        model,
        temperature,
        timestamp: new Date(),
      };
      setComparisonRuns([...comparisonRuns, newRun]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (result: ExtractionResult): number => {
    const analysis = result.analysis;
    const fields = [
      analysis.birads_value,
      analysis.exam_date,
      analysis.modality,
      analysis.findings?.length,
      analysis.recommendations?.length,
    ];
    const filled = fields.filter(f => f !== null && f !== undefined && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getValidationStatus = (value: unknown): 'valid' | 'missing' | 'empty' => {
    if (value === null || value === undefined) return 'missing';
    if (Array.isArray(value) && value.length === 0) return 'empty';
    if (typeof value === 'string' && value.trim() === '') return 'empty';
    return 'valid';
  };

  return (
    <div className="fade-up">
      <div className="page-head">
        <div>
          <h1 className="t-h1">Extraction Test Harness</h1>
          <div className="sub">Test and tweak data extraction capabilities</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Input & Controls */}
        <div>
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>Upload Report</h3>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Paste report text here..."
              style={{
                width: '100%',
                minHeight: 200,
                padding: 12,
                border: '1px solid var(--slate-300)',
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 12,
                color: 'var(--fg-1)',
                marginBottom: 16,
              }}
            />

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Prompt Variant
              </label>
              <select
                value={promptVariant}
                onChange={(e) => setPromptVariant(e.target.value as typeof promptVariant)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--slate-300)',
                  borderRadius: 6,
                }}
              >
                <option value="default">Default</option>
                <option value="strict">Strict (higher confidence)</option>
                <option value="lenient">Lenient (more comprehensive)</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--slate-300)',
                  borderRadius: 6,
                }}
              >
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="claude-opus-4-8">Claude Opus 4.8</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: loading ? 'var(--slate-200)' : 'var(--blue-500)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze Report'}
            </button>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: 'var(--danger-50)',
                  border: '1px solid var(--danger-200)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--danger-700)',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          {currentResult && (
            <div className="card card-pad">
              <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Extraction Results</h3>

              <div
                style={{
                  padding: 12,
                  background: 'var(--slate-50)',
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Completion</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {calculateCompletion(currentResult)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--slate-200)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${calculateCompletion(currentResult)}%`,
                      background: 'var(--blue-500)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                  Time: {currentResult.processing_time_ms}ms
                </div>
              </div>

              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Key Fields</h4>
                {[
                  { key: 'birads_value', label: 'BI-RADS', value: currentResult.analysis.birads_value },
                  { key: 'exam_date', label: 'Exam Date', value: currentResult.analysis.exam_date },
                  { key: 'modality', label: 'Modality', value: currentResult.analysis.modality },
                  { key: 'findings', label: 'Findings', value: currentResult.analysis.findings?.length || 0 },
                  { key: 'recommendations', label: 'Recommendations', value: currentResult.analysis.recommendations?.length || 0 },
                ].map(({ key, label, value }) => {
                  const status = getValidationStatus(value);
                  const bgColor =
                    status === 'valid'
                      ? 'var(--success-50)'
                      : status === 'empty'
                      ? 'var(--warning-50)'
                      : 'var(--danger-50)';
                  const borderColor =
                    status === 'valid'
                      ? 'var(--success-200)'
                      : status === 'empty'
                      ? 'var(--warning-200)'
                      : 'var(--danger-200)';
                  const textColor =
                    status === 'valid'
                      ? 'var(--success-700)'
                      : status === 'empty'
                      ? 'var(--warning-700)'
                      : 'var(--danger-700)';

                  return (
                    <div
                      key={key}
                      style={{
                        padding: 8,
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 4,
                        marginBottom: 6,
                        fontSize: 11,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: textColor, marginBottom: 2 }}>
                        {label}
                      </div>
                      <div style={{ color: textColor, fontSize: 10 }}>
                        {value !== null && value !== undefined
                          ? String(value)
                          : `[${status.toUpperCase()}]`}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (comparisonRuns.length >= 2) {
                    setCompareMode(!compareMode);
                  }
                }}
                disabled={comparisonRuns.length < 2}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '8px 12px',
                  background: comparisonRuns.length >= 2 ? 'var(--slate-500)' : 'var(--slate-200)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: comparisonRuns.length >= 2 ? 'pointer' : 'not-allowed',
                }}
              >
                {compareMode ? 'Hide Comparison' : 'Compare Runs'} ({comparisonRuns.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {compareMode && comparisonRuns.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <div className="card card-pad">
            <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
              Comparison: {comparisonRuns.length} runs
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 11,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Run</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Prompt</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Model</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Temp</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Completion</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Time</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>BI-RADS</th>
                    <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRuns.map((run, idx) => (
                    <tr
                      key={run.id}
                      style={{
                        borderBottom: '1px solid var(--slate-100)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--slate-50)',
                      }}
                    >
                      <td style={{ padding: 8 }}>{idx + 1}</td>
                      <td style={{ padding: 8 }}>{run.prompt_variant}</td>
                      <td style={{ padding: 8 }}>{run.model.split('-').pop()}</td>
                      <td style={{ padding: 8 }}>{run.temperature.toFixed(1)}</td>
                      <td style={{ padding: 8, fontWeight: 600 }}>
                        {calculateCompletion(run.result)}%
                      </td>
                      <td style={{ padding: 8 }}>{run.result.processing_time_ms}ms</td>
                      <td style={{ padding: 8 }}>
                        {run.result.analysis.birads_value ?? '-'}
                      </td>
                      <td style={{ padding: 8 }}>
                        {run.result.analysis.findings?.length ?? 0}
                      </td>
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
