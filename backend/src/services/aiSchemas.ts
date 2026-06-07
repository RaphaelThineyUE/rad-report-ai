/**
 * Zod schemas for Anthropic structured outputs (see claudeService.ts).
 * Each schema mirrors the JSON payload Claude returns for a given analysis call and
 * is passed to `client.messages.parse()` via `zodOutputFormat()`, which validates the
 * model response and exposes a typed `parsed_output`. This replaces the previous
 * fragile regex + JSON.parse extraction. Inferred types are re-exported so the rest
 * of the service has a single source of truth for these shapes.
 *
 * Imported from `zod/v4` to match the type the SDK's zod helper expects.
 */
import { z } from 'zod/v4';

export const FindingSchema = z.object({
  laterality: z.string(),
  location: z.string(),
  description: z.string(),
  assessment: z.string(),
  evidence: z.array(z.string()),
});

export const RecommendationSchema = z.object({
  action: z.string(),
  timeframe: z.string(),
  evidence: z.array(z.string()),
});

/** Output of analyzeReport — key clinical data extracted from a single report. */
export const ReportAnalysisSchema = z.object({
  summary: z.string(),
  birads_value: z.number(),
  birads_confidence: z.enum(['low', 'medium', 'high']),
  breast_density: z.string(),
  exam_type: z.string(),
  laterality: z.string(),
  prior_exam_date: z.string().nullable(),
  findings: z.array(FindingSchema),
  recommendations: z.array(RecommendationSchema),
  red_flags: z.array(z.string()),
});

/** Output of consolidateReports — a cross-report summary for one patient. */
export const ConsolidationSchema = z.object({
  overall_summary: z.string(),
  key_trends: z.array(z.string()),
  overall_birads: z.number(),
  clinical_implications: z.string(),
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
export type ReportAnalysis = z.infer<typeof ReportAnalysisSchema>;
export type Consolidation = z.infer<typeof ConsolidationSchema>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export type BiradsTrend = z.infer<typeof BiradsTrendSchema>;
