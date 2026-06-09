/**
 * Renders the full extracted content of a processed radiology report.
 * Consumed by ReportDetail in both inline and slide-over modes.
 * Sections render only when the relevant fields are non-null/non-empty,
 * so pending/failed reports show only the file info and status blocks.
 */
import { BiRads } from '@/components/ui/BiRads';
import { BiRadsTrendSparkline } from '@/components/analytics';
import type { Report, ReportFinding } from '@/hooks/useReports';

const SECTION: React.CSSProperties = { display: 'grid', gap: 12 };
const LABEL: React.CSSProperties = { fontSize: 12, color: 'var(--fg-3)', marginBottom: 2 };
const VALUE: React.CSSProperties = { fontSize: 13 };

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', borderBottom: '1px solid var(--border-1)', paddingBottom: 6 }}>
      {title}
    </h3>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={LABEL}>{label}</div>
      <div style={VALUE}>{value}</div>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: ReportFinding; index: number }) {
  return (
    <div style={{ border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: 12, background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)' }}>Finding {index + 1}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {finding.per_finding_birads !== undefined && (
            <BiRads value={String(finding.per_finding_birads)} size="sm" />
          )}
          {finding.interval_change && finding.interval_change !== 'not_applicable' && (
            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 'var(--r-xs)', background: 'var(--warning-100)', color: 'var(--warning-700)', textTransform: 'capitalize' }}>
              {finding.interval_change}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {finding.laterality && <Field label="Laterality" value={finding.laterality} />}
        {finding.location && <Field label="Location" value={finding.location} />}
        {finding.finding_type && <Field label="Type" value={<span style={{ textTransform: 'capitalize' }}>{finding.finding_type.replace(/_/g, ' ')}</span>} />}
        {finding.size_mm !== undefined && <Field label="Size" value={`${finding.size_mm} mm`} />}
        {finding.clock_position && <Field label="Clock position" value={finding.clock_position} />}
        {finding.distance_from_nipple_cm !== undefined && <Field label="Distance from nipple" value={`${finding.distance_from_nipple_cm} cm`} />}
        {finding.quadrant && <Field label="Quadrant" value={finding.quadrant} />}
        {finding.depth && <Field label="Depth" value={<span style={{ textTransform: 'capitalize' }}>{finding.depth}</span>} />}
        {finding.shape && <Field label="Shape" value={<span style={{ textTransform: 'capitalize' }}>{finding.shape}</span>} />}
        {finding.margin && <Field label="Margin" value={<span style={{ textTransform: 'capitalize' }}>{finding.margin}</span>} />}
        {finding.calcification_morphology && <Field label="Calcification morphology" value={finding.calcification_morphology} />}
        {finding.calcification_distribution && <Field label="Calcification distribution" value={finding.calcification_distribution} />}
      </div>

      {finding.description && (
        <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{finding.description}</p>
      )}
      {finding.assessment && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic' }}>{finding.assessment}</p>
      )}
      {finding.ultrasound_features && <Field label="Ultrasound features" value={finding.ultrasound_features} />}
      {finding.mri_features && <Field label="MRI features" value={finding.mri_features} />}
    </div>
  );
}

interface Props {
  report: Report;
  biRadsTrendData: { date: string; birads: number }[];
}

export function ReportDetailContent({ report, biRadsTrendData }: Props) {
  const fileSizeStr = report.file_size
    ? `${Math.max(report.file_size / (1024 * 1024), 0.01).toFixed(2)} MB`
    : 'Unknown';

  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const statusColor = {
    completed: { bg: 'var(--success-50)', fg: 'var(--success-700)' },
    processing: { bg: 'var(--warning-50)', fg: 'var(--warning-700)' },
    failed:     { bg: 'var(--danger-50)',  fg: 'var(--danger-700)'  },
    pending:    { bg: 'var(--fg-6)',        fg: 'var(--fg-2)'        },
  }[report.status] ?? { bg: 'var(--fg-6)', fg: 'var(--fg-2)' };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* BI-RADS Trend */}
      {biRadsTrendData.length >= 2 && (
        <div>
          <SectionHeader title="BI-RADS Trend" />
          <div style={{ height: 60 }}>
            <BiRadsTrendSparkline data={biRadsTrendData} size="md" />
          </div>
        </div>
      )}

      {/* File Information */}
      <div>
        <SectionHeader title="File Information" />
        <div style={SECTION}>
          <Field label="Filename" value={<span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{report.filename}</span>} />
          <Field label="Uploaded" value={formattedDate} />
          <Field label="File size" value={fileSizeStr} />
        </div>
      </div>

      {/* Processing Status */}
      <div>
        <SectionHeader title="Processing Status" />
        <div style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: statusColor.bg, color: statusColor.fg }}>
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{report.status}</span>
          {report.processing_time_ms && (
            <span style={{ fontSize: 12, marginLeft: 8, opacity: 0.8 }}>
              · {(report.processing_time_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Exam Information */}
      {(report.exam_date || report.modality || report.contrast || report.exam_laterality || report.exam_type) && (
        <div>
          <SectionHeader title="Exam Information" />
          <div style={{ ...SECTION, gridTemplateColumns: '1fr 1fr' }}>
            {report.exam_date && <Field label="Exam date" value={new Date(report.exam_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />}
            {report.modality && <Field label="Modality" value={<span style={{ textTransform: 'capitalize' }}>{report.modality}</span>} />}
            {report.contrast && report.contrast !== 'not_applicable' && <Field label="Contrast" value={<span style={{ textTransform: 'capitalize' }}>{report.contrast}</span>} />}
            {report.exam_laterality && <Field label="Laterality" value={<span style={{ textTransform: 'capitalize' }}>{report.exam_laterality}</span>} />}
            {report.exam_type && <Field label="Exam type" value={report.exam_type} />}
          </div>
        </div>
      )}

      {/* Clinical Context */}
      {(report.clinical_history || report.risk_factors?.length || report.comparison_prior_exam_date || report.comparison_dates?.length) && (
        <div>
          <SectionHeader title="Clinical Context" />
          <div style={SECTION}>
            {report.clinical_history && <Field label="Clinical history" value={<span style={{ lineHeight: 1.5 }}>{report.clinical_history}</span>} />}
            {report.risk_factors && report.risk_factors.length > 0 && (
              <Field label="Risk factors" value={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.risk_factors.map((r, i) => <li key={i} style={{ fontSize: 13 }}>{r}</li>)}
                </ul>
              } />
            )}
            {report.comparison_prior_exam_date && (
              <Field label="Prior exam (comparison)" value={new Date(report.comparison_prior_exam_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
            )}
            {report.comparison_dates && report.comparison_dates.length > 0 && (
              <Field label="Comparison dates" value={report.comparison_dates.join(', ')} />
            )}
          </div>
        </div>
      )}

      {/* Findings */}
      {report.findings && report.findings.length > 0 && (
        <div>
          <SectionHeader title={`Findings (${report.findings.length})`} />
          <div style={{ display: 'grid', gap: 10 }}>
            {report.findings.map((f, i) => <FindingCard key={i} finding={f} index={i} />)}
          </div>
        </div>
      )}

      {/* Additional Observations */}
      {(report.lymph_nodes?.length || report.skin_nipple_changes?.length || report.implants || report.post_surgical_changes?.length) && (
        <div>
          <SectionHeader title="Additional Observations" />
          <div style={SECTION}>
            {report.lymph_nodes && report.lymph_nodes.length > 0 && (
              <div>
                <div style={LABEL}>Lymph nodes</div>
                {report.lymph_nodes.map((n, i) => (
                  <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{n.laterality} {n.region}</span>
                    {' — '}{n.abnormal ? <span style={{ color: 'var(--danger-700)' }}>Abnormal</span> : 'Normal'}
                    {n.morphology && ` · ${n.morphology}`}
                    {n.size_mm !== undefined && ` · ${n.size_mm} mm`}
                  </div>
                ))}
              </div>
            )}
            {report.skin_nipple_changes && report.skin_nipple_changes.length > 0 && (
              <Field label="Skin / nipple changes" value={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.skin_nipple_changes.map((c, i) => <li key={i} style={{ fontSize: 13 }}>{c}</li>)}
                </ul>
              } />
            )}
            {report.implants?.present && (
              <Field label="Implants" value={
                <>
                  {report.implants.type && <span style={{ textTransform: 'capitalize' }}>{report.implants.type}</span>}
                  {report.implants.integrity && <span style={{ color: 'var(--fg-3)' }}> · {report.implants.integrity}</span>}
                </>
              } />
            )}
            {report.post_surgical_changes && report.post_surgical_changes.length > 0 && (
              <Field label="Post-surgical changes" value={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.post_surgical_changes.map((c, i) => <li key={i} style={{ fontSize: 13 }}>{c}</li>)}
                </ul>
              } />
            )}
          </div>
        </div>
      )}

      {/* Disease Extent */}
      {(report.multifocal || report.multicentric || report.bilateral_disease || report.disease_extent) && (
        <div>
          <SectionHeader title="Disease Extent" />
          <div style={{ ...SECTION, gridTemplateColumns: '1fr 1fr' }}>
            {report.multifocal != null && <Field label="Multifocal" value={report.multifocal ? 'Yes' : 'No'} />}
            {report.multicentric != null && <Field label="Multicentric" value={report.multicentric ? 'Yes' : 'No'} />}
            {report.bilateral_disease != null && <Field label="Bilateral disease" value={report.bilateral_disease ? 'Yes' : 'No'} />}
            {report.disease_extent && <Field label="Extent" value={report.disease_extent} />}
          </div>
        </div>
      )}

      {/* BI-RADS Assessment */}
      {(report.birads_value != null || report.breast_density_value) && (
        <div>
          <SectionHeader title="BI-RADS Assessment" />
          <div style={SECTION}>
            {report.birads_value != null && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <BiRads value={String(report.birads_value)} size="lg" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>BI-RADS {report.birads_value}</div>
                  {report.birads_confidence && (
                    <div style={{ fontSize: 12, color: 'var(--fg-3)', textTransform: 'capitalize' }}>
                      Confidence: {report.birads_confidence}
                    </div>
                  )}
                </div>
              </div>
            )}
            {report.breast_density_value && <Field label="Breast density" value={report.breast_density_value} />}
          </div>
        </div>
      )}

      {/* Summary */}
      {report.summary && (
        <div>
          <SectionHeader title="Summary" />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--fg-2)' }}>{report.summary}</p>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <SectionHeader title="Recommendations" />
          <div style={{ display: 'grid', gap: 8 }}>
            {report.recommendations.map((rec, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border-2)' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{rec.action}</div>
                {rec.timeframe && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>Timeframe: {rec.timeframe}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Management */}
      {report.management && (
        <div>
          <SectionHeader title="Management Plan" />
          <div style={{ ...SECTION, gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Biopsy recommended" value={
              <span style={{ color: report.management.biopsy_recommended ? 'var(--danger-700)' : 'var(--success-700)', fontWeight: 600 }}>
                {report.management.biopsy_recommended ? 'Yes' : 'No'}
              </span>
            } />
            {report.management.recommended_modality && <Field label="Modality" value={report.management.recommended_modality} />}
            {report.management.follow_up_interval && <Field label="Follow-up interval" value={report.management.follow_up_interval} />}
          </div>
        </div>
      )}

      {/* Pathology Correlation */}
      {report.pathology_correlation && (
        <div>
          <SectionHeader title="Pathology Correlation" />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{report.pathology_correlation}</p>
        </div>
      )}

      {/* Red Flags */}
      {report.red_flags && report.red_flags.length > 0 && (
        <div>
          <SectionHeader title="🚨 Red Flags" />
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--danger-700)', fontSize: 13 }}>
            {report.red_flags.map((flag, i) => <li key={i} style={{ marginBottom: 4 }}>{flag}</li>)}
          </ul>
        </div>
      )}

      {/* Clinical Disclaimer */}
      {report.status === 'completed' && (
        <div style={{ padding: '12px', borderRadius: 'var(--r-sm)', backgroundColor: 'var(--info-50)', borderLeft: '3px solid var(--info-500)', color: 'var(--info-700)', fontSize: 12, lineHeight: 1.5 }}>
          <strong>⚠️ Clinical Review Required</strong>
          <p style={{ margin: '6px 0 0 0' }}>
            This analysis is AI-generated and must be reviewed by a qualified radiologist before clinical use.
            Do not rely solely on this analysis for diagnosis.
          </p>
        </div>
      )}
    </div>
  );
}
