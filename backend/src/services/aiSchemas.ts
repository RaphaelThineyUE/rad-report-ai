/**
 * Zod schemas for Anthropic structured outputs (see claudeService.ts).
 * Each schema mirrors the JSON payload Claude returns for a given analysis call and
 * is passed to `client.messages.parse()` via `zodOutputFormat()`, which validates the
 * model response and exposes a typed `parsed_output`. Inferred types are re-exported so
 * the rest of the service has a single source of truth for these shapes.
 *
 * Convention: fields that may be absent in a report are `.nullable()` (the model returns
 * null rather than omitting them); list fields are always present (possibly empty).
 *
 * Imported from `zod/v4` to match the type the SDK's zod helper expects.
 */
import { z } from 'zod/v4';

// ── Controlled vocabularies ────────────────────────────────────────────────
export const Modality = z.enum([
  'mammography',
  'tomosynthesis',
  'ultrasound',
  'mri',
  'other',
]);
export const FindingType = z.enum([
  'mass',
  'calcifications',
  'asymmetry',
  'architectural_distortion',
  'lymph_node',
  'other',
]);
export const Shape = z.enum(['oval', 'round', 'irregular']);
export const Margin = z.enum([
  'circumscribed',
  'obscured',
  'microlobulated',
  'indistinct',
  'spiculated',
]);
export const Quadrant = z.enum([
  'UOQ',
  'UIQ',
  'LOQ',
  'LIQ',
  'central',
  'subareolar',
  'axillary_tail',
]);
export const Depth = z.enum(['anterior', 'middle', 'posterior']);
export const IntervalChange = z.enum([
  'new',
  'increased',
  'decreased',
  'stable',
  'resolved',
  'not_applicable',
]);

// ── Lesion-level finding ───────────────────────────────────────────────────
export const FindingSchema = z.object({
  // Core (kept for backward compatibility).
  laterality: z.string(),
  location: z.string(),
  description: z.string(),
  assessment: z.string(),
  evidence: z.array(z.string()),
  // Classification & measurement.
  finding_type: FindingType,
  size_mm: z.number().nullable(),
  per_finding_birads: z.number().nullable(),
  interval_change: IntervalChange.nullable(),
  // Localization.
  clock_position: z.string().nullable(),
  distance_from_nipple_cm: z.number().nullable(),
  quadrant: Quadrant.nullable(),
  depth: Depth.nullable(),
  // Mass morphology (BI-RADS lexicon).
  shape: Shape.nullable(),
  margin: Margin.nullable(),
  // Calcification descriptors.
  calcification_morphology: z.string().nullable(),
  calcification_distribution: z.string().nullable(),
  // Modality-specific feature summaries.
  ultrasound_features: z.string().nullable(),
  mri_features: z.string().nullable(),
});

export const RecommendationSchema = z.object({
  action: z.string(),
  timeframe: z.string(),
  evidence: z.array(z.string()),
});

export const LymphNodeSchema = z.object({
  laterality: z.string(),
  region: z.string().nullable(),
  abnormal: z.boolean(),
  morphology: z.string().nullable(),
  size_mm: z.number().nullable(),
  evidence: z.array(z.string()),
});

export const ImplantSchema = z.object({
  present: z.boolean(),
  type: z.string().nullable(),
  integrity: z.string().nullable(),
});

export const ManagementSchema = z.object({
  biopsy_recommended: z.boolean(),
  recommended_modality: z.string().nullable(),
  follow_up_interval: z.string().nullable(),
});

/** Output of analyzeReport — key clinical data extracted from a single report. */
export const ReportAnalysisSchema = z.object({
  // Study-level.
  summary: z.string(),
  exam_date: z.string().nullable(),
  modality: Modality.nullable(),
  contrast: z.enum(['with', 'without', 'not_applicable']).nullable(),
  exam_type: z.string(),
  laterality: z.string(),
  breast_density: z.enum(['A', 'B', 'C', 'D']).nullable(),
  birads_value: z.number(),
  birads_confidence: z.enum(['low', 'medium', 'high']),
  clinical_history: z.string().nullable(),
  risk_factors: z.array(z.string()),
  prior_exam_date: z.string().nullable(),
  comparison_dates: z.array(z.string()),
  // Lesions and other findings.
  findings: z.array(FindingSchema),
  lymph_nodes: z.array(LymphNodeSchema),
  skin_nipple_changes: z.array(z.string()),
  implants: ImplantSchema.nullable(),
  post_surgical_changes: z.array(z.string()),
  // Disease extent (surgical planning).
  multifocal: z.boolean().nullable(),
  multicentric: z.boolean().nullable(),
  bilateral_disease: z.boolean().nullable(),
  disease_extent: z.string().nullable(),
  // Management & correlation.
  recommendations: z.array(RecommendationSchema),
  management: ManagementSchema,
  pathology_correlation: z.string().nullable(),
  red_flags: z.array(z.string()),
});

/** One study in a patient's imaging timeline (for consolidation). */
export const TimelinePointSchema = z.object({
  exam_date: z.string().nullable(),
  modality: z.string().nullable(),
  birads: z.number().nullable(),
  key_change: z.string(),
});

/** Output of consolidateReports — a cross-report summary for one patient. */
export const ConsolidationSchema = z.object({
  overall_summary: z.string(),
  key_trends: z.array(z.string()),
  overall_birads: z.number(),
  clinical_implications: z.string(),
  timeline: z.array(TimelinePointSchema),
  pathology_correlation: z.string().nullable(),
});

export const TreatmentResponseSchema = z.object({
  treatment_type: z.string(),
  assessment: z.string(),
});

/** Output of compareTreatments — treatment assessment against current findings. */
export const ComparisonSchema = z.object({
  treatment_responses: z.array(TreatmentResponseSchema),
  recommendations: z.array(z.string()),
  evidence_summary: z.string(),
});

/** Output of detectBiradsTrend — direction/significance of the BI-RADS trend. */
export const BiradsTrendSchema = z.object({
  trend: z.enum(['improving', 'worsening', 'stable', 'insufficient_data']),
  direction: z.enum(['up', 'down', 'none']),
  significance: z.enum(['low', 'medium', 'high']),
  clinical_note: z.string(),
});

export type Finding = z.infer<typeof FindingSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type LymphNode = z.infer<typeof LymphNodeSchema>;
export type Implant = z.infer<typeof ImplantSchema>;
export type Management = z.infer<typeof ManagementSchema>;
export type ReportAnalysis = z.infer<typeof ReportAnalysisSchema>;
export type TimelinePoint = z.infer<typeof TimelinePointSchema>;
export type Consolidation = z.infer<typeof ConsolidationSchema>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export type BiradsTrend = z.infer<typeof BiradsTrendSchema>;
