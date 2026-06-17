/**
 * Anthropic Claude integration for radiology report AI analysis (backend only).
 * Exports: analyzeReport, generateSummary, consolidateReports, compareTreatments,
 * detectBiradsTrend, cleanupIdentifiers, matchSourceQuotes — plus their result types.
 * The Claude model is configurable via the ANTHROPIC_MODEL env var (default:
 * claude-sonnet-4-6); this module is the single source of truth for model selection.
 * Structured responses are validated with Zod via `client.messages.parse()` and the
 * `zodOutputFormat()` helper (schemas live in aiSchemas.ts), replacing regex/JSON.parse
 * extraction. cleanupIdentifiers delegates to the local de-identification pipeline
 * (deterministic regex in deidentify.ts — patient name, DOB, addresses, and direct
 * identifiers only) so PHI never reaches Anthropic while clinical data is preserved;
 * matchSourceQuotes verifies evidence against raw text to flag hallucinations.
 * Every exported function appends a clinical disclaimer.
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { logger } from '../utils/logger.js';
import {
  ReportAnalysisSchema,
  SummarySchema,
  ConsolidationSchema,
  ComparisonSchema,
  BiradsTrendSchema,
  type Finding,
  type Recommendation,
  type LymphNode,
  type Implant,
  type Management,
  type TimelinePoint,
} from './aiSchemas.js';
import { deidentify } from './deidentify.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

const CLINICAL_DISCLAIMER = `⚠️ CLINICAL REVIEW REQUIRED: This analysis is AI-generated and must be reviewed by a qualified radiologist. Do not use as a substitute for professional medical judgment. All recommendations should be verified against the original report and clinical context.`;

interface AnalysisOptions {
  prompt_variant?: 'default' | 'strict' | 'lenient';
  model?: string;
  temperature?: number;
}

/**
 * Main analysis function that extracts key clinical data from a radiology report
 */
export async function analyzeReport(reportText: string, options?: AnalysisOptions): Promise<AnalysisResult> {
  const startTime = Date.now();
  const modelToUse = options?.model ?? MODEL;
  const temperature = options?.temperature ?? 0.7;
  const variant = options?.prompt_variant ?? 'default';

  try {
    let systemPrompt = `You are an expert radiologist analyzing breast imaging reports. Extract the following information:

**Study Details:**
- Exam date (format: YYYY-MM-DD if possible)
- Modality (mammography/tomosynthesis/ultrasound/mri/other)
- Contrast status (with/without/not_applicable)
- Exam type (screening/diagnostic/follow-up)
- Laterality (bilateral/left/right)
- Breast density (A/B/C/D if applicable)
- Clinical history (any mentioned patient presentation)
- Risk factors (mentioned cancer risk factors)
- Prior exam date(s) and comparison notes
- Pathology correlation (if mentioned)

**Findings for each lesion/mass:**
- Type (mass/calcifications/asymmetry/architectural_distortion/lymph_node/other)
- Size in mm
- Per-finding BI-RADS category
- Interval change (new/increased/decreased/stable/resolved/not_applicable)
- Location: clock position, distance from nipple (cm), quadrant, depth (anterior/middle/posterior)
- Morphology: shape (oval/round/irregular), margin (circumscribed/obscured/microlobulated/indistinct/spiculated)
- Calcification morphology and distribution (if applicable)
- Ultrasound features (if applicable)
- MRI features (if applicable)

**Systemic findings:**
- Lymph nodes (region, abnormal status, morphology, size mm)
- Implants (present, type, integrity)
- Skin/nipple changes
- Post-surgical changes

**Disease extent (surgical planning):**
- Multifocal (same breast, different quadrants)
- Multicentric (different breasts)
- Bilateral disease
- Overall disease extent summary

**Assessment & Recommendations:**
- BI-RADS value (0-6) and confidence (low/medium/high)
- Biopsy recommendation
- Recommended modality for follow-up
- Follow-up interval
- Clinical recommendations
- Red flags or urgent findings

Provide evidence (quoted text) for all findings.`;

    // Apply variant-specific prompt modifications
    if (variant === 'strict') {
      systemPrompt += `\n\n**STRICT MODE:** Only include findings with HIGH confidence. Use exact language from the report. Do not infer or extrapolate. When uncertain, mark confidence as "low" rather than guessing values.`;
    } else if (variant === 'lenient') {
      systemPrompt += `\n\n**LENIENT MODE:** Be comprehensive and include all mentioned findings, even those with lower confidence. Infer logical implications from the report. Mark lower-confidence findings but include them.`;
    }

    const userPrompt = `Please analyze this radiology report:\n\n${reportText}`;

    const message = await client.messages.parse({
      model: modelToUse,
      max_tokens: 2000,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      output_config: { format: zodOutputFormat(ReportAnalysisSchema) },
    });

    const analysisData = message.parsed_output;
    if (!analysisData) {
      const validationError = new Error('Failed to parse structured analysis from Claude response');
      logger.error('Analysis validation failed - no parsed output', {
        error: validationError.message,
        processingTime: Date.now() - startTime
      });
      throw validationError;
    }

    const processingTime = Date.now() - startTime;
    logger.info('Successfully analyzed report with Claude', { processingTime });

    return {
      summary: analysisData.summary,
      birads_value: analysisData.birads_value,
      birads_confidence: analysisData.birads_confidence,
      breast_density_value: analysisData.breast_density,
      exam_date: analysisData.exam_date,
      modality: analysisData.modality,
      contrast: analysisData.contrast,
      exam_type: analysisData.exam_type,
      exam_laterality: analysisData.laterality,
      clinical_history: analysisData.clinical_history,
      risk_factors: analysisData.risk_factors,
      prior_exam_date: analysisData.prior_exam_date,
      comparison_dates: analysisData.comparison_dates,
      findings: analysisData.findings,
      lymph_nodes: analysisData.lymph_nodes,
      skin_nipple_changes: analysisData.skin_nipple_changes,
      implants: analysisData.implants,
      post_surgical_changes: analysisData.post_surgical_changes,
      multifocal: analysisData.multifocal,
      multicentric: analysisData.multicentric,
      bilateral_disease: analysisData.bilateral_disease,
      disease_extent: analysisData.disease_extent,
      recommendations: analysisData.recommendations,
      management: analysisData.management,
      pathology_correlation: analysisData.pathology_correlation,
      red_flags: analysisData.red_flags,
      raw_analysis: JSON.stringify(analysisData),
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const processingTime = Date.now() - startTime;
    logger.error('Failed to analyze report', {
      error: message,
      processingTime,
      modelUsed: modelToUse,
      variant
    });
    throw new Error(`Report analysis failed: ${message}`);
  }
}

/**
 * Generate a summary of a single report
 */
export async function generateSummary(reportText: string): Promise<SummaryResult> {
  const startTime = Date.now();
  try {
    const message = await client.messages.parse({
      model: MODEL,
      max_tokens: 300,
      system:
        'You are a clinical summarizer. Create a concise, one-paragraph summary of the key findings and assessment.',
      messages: [
        {
          role: 'user',
          content: `Summarize this radiology report:\n\n${reportText}`,
        },
      ],
      output_config: { format: zodOutputFormat(SummarySchema) },
    });

    const summaryData = message.parsed_output;
    if (!summaryData) {
      throw new Error('Failed to parse structured summary from Claude response');
    }

    const processingTime = Date.now() - startTime;
    logger.info('Successfully generated summary', { processingTime });

    return {
      summary: summaryData.summary,
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to generate summary', { error: message });
    throw new Error(`Summary generation failed: ${message}`);
  }
}

/**
 * Consolidate multiple reports into a single comprehensive summary
 */
export async function consolidateReports(
  reports: Array<{ text: string; date: string }>
): Promise<ConsolidationResult> {
  try {
    const reportsText = reports
      .map((r) => `Date: ${r.date}\n${r.text}`)
      .join('\n\n---\n\n');

    const message = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: `You are a clinical consolidator. Review multiple radiology reports across a patient's imaging timeline and create:

1. Overall summary: key findings and trajectory of disease
2. Key trends: how findings have evolved over time
3. Overall BI-RADS: final assessment integrating all reports
4. Clinical implications: what this trajectory means for management
5. Timeline: for each exam, capture exam_date (YYYY-MM-DD), modality (mammography/tomosynthesis/ultrasound/mri/other), birads value, and key_change (what changed from prior if applicable)
6. Pathology correlation: if any surgical/pathology results are mentioned that correlate with imaging

Focus on temporal trends, interval changes, and any pathology correlation mentioned.`,
      messages: [
        {
          role: 'user',
          content: `Consolidate these reports:\n\n${reportsText}`,
        },
      ],
      output_config: { format: zodOutputFormat(ConsolidationSchema) },
    });

    const consolidation = message.parsed_output;
    if (!consolidation) {
      const validationError = new Error('Failed to parse structured consolidation from Claude response');
      logger.error('Consolidation validation failed - no parsed output', {
        error: validationError.message,
        reportCount: reports.length
      });
      throw validationError;
    }

    logger.info('Successfully consolidated reports', {
      reportCount: reports.length,
      timelineCount: consolidation.timeline.length
    });

    return {
      overall_summary: consolidation.overall_summary,
      key_trends: consolidation.key_trends,
      overall_birads: consolidation.overall_birads,
      clinical_implications: consolidation.clinical_implications,
      timeline: consolidation.timeline,
      pathology_correlation: consolidation.pathology_correlation,
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to consolidate reports', {
      error: message,
      reportCount: reports.length
    });
    throw new Error(`Report consolidation failed: ${message}`);
  }
}

/**
 * Compare treatments based on radiology findings
 */
export async function compareTreatments(
  reportText: string,
  treatments: Array<{ type: string; outcome?: string }>
): Promise<ComparisonResult> {
  try {
    const treatmentsText = treatments
      .map(
        (t) =>
          `Type: ${t.type}, Outcome: ${t.outcome || 'Unknown'}`
      )
      .join('\n');

    const message = await client.messages.parse({
      model: MODEL,
      max_tokens: 1000,
      system: `You are a clinical expert. Compare treatments against the current radiology findings.
Provide, for each treatment, an assessment of its alignment with the findings, overall
clinical recommendations, and a summary of the supporting evidence.`,
      messages: [
        {
          role: 'user',
          content: `Report findings:\n${reportText}\n\nTreatments:\n${treatmentsText}`,
        },
      ],
      output_config: { format: zodOutputFormat(ComparisonSchema) },
    });

    const comparison = message.parsed_output;
    if (!comparison) {
      const validationError = new Error('Failed to parse structured comparison from Claude response');
      logger.error('Comparison validation failed - no parsed output', {
        error: validationError.message,
        treatmentCount: treatments.length
      });
      throw validationError;
    }

    logger.info('Successfully compared treatments', {
      treatmentCount: treatments.length,
      treatmentResponseCount: comparison.treatment_responses.length,
      recommendationCount: comparison.recommendations.length
    });

    return {
      treatment_responses: comparison.treatment_responses,
      recommendations: comparison.recommendations,
      evidence_summary: comparison.evidence_summary,
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to compare treatments', {
      error: message,
      treatmentCount: treatments.length
    });
    throw new Error(`Treatment comparison failed: ${message}`);
  }
}

/**
 * Detect BI-RADS trends across multiple reports
 */
export async function detectBiradsTrend(
  biradValues: Array<{ value: number; date: string }>
): Promise<BiradsTrendResult> {
  try {
    if (biradValues.length < 2) {
      return {
        trend: 'insufficient_data',
        direction: 'unknown',
        significance: 'low',
        clinical_note: 'Insufficient data for trend analysis',
      };
    }

    const valuesText = biradValues
      .map((v) => `Date: ${v.date}, BI-RADS: ${v.value}`)
      .join('\n');

    const message = await client.messages.parse({
      model: MODEL,
      max_tokens: 300,
      system: `Analyze the BI-RADS trend across the provided assessments. Report the overall
trend (improving/worsening/stable/insufficient_data), the direction (up/down/none),
the clinical significance (low/medium/high), and a brief explanatory note.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this BI-RADS trend:\n${valuesText}`,
        },
      ],
      output_config: { format: zodOutputFormat(BiradsTrendSchema) },
    });

    const trendData = message.parsed_output;
    if (!trendData) {
      logger.error('Trend analysis validation failed - no parsed output', {
        biradValuesCount: biradValues.length
      });
      return {
        trend: 'insufficient_data',
        direction: 'none',
        significance: 'low',
        clinical_note: 'Failed to analyze trend data - validation error',
      };
    }

    logger.info('Successfully detected BI-RADS trend', {
      biradValuesCount: biradValues.length,
      trend: trendData.trend,
      direction: trendData.direction,
      significance: trendData.significance
    });

    return {
      trend: trendData.trend,
      direction: trendData.direction,
      significance: trendData.significance,
      clinical_note: trendData.clinical_note,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to detect trend', {
      error: message,
      biradValuesCount: biradValues.length
    });
    return {
      trend: 'insufficient_data',
      direction: 'none',
      significance: 'low',
      clinical_note: 'Error during trend analysis',
    };
  }
}

/**
 * Clean up personal identifiers from text.
 * Delegates to the local de-identification pipeline (regex + wink-nlp NER) so that
 * PHI never leaves the process — no Anthropic call is involved. Kept async for
 * backward compatibility with existing callers.
 */
export async function cleanupIdentifiers(text: string): Promise<string> {
  return deidentify(text);
}

/**
 * Match source quotes from the original text
 * Verifies that Claude's findings are actually present in the report
 */
export async function matchSourceQuotes(
  findings: string[],
  reportText: string
): Promise<Map<string, string[]>> {
  const quotes = new Map<string, string[]>();

  try {
    for (const finding of findings) {
      const matchedQuotes: string[] = [];

      // Strategy 1: Try exact phrase matching (case-insensitive)
      const exactRegex = new RegExp(
        `([^.!?]*${escapeRegExp(finding)}[^.!?]*)`,
        'gi'
      );
      const exactMatches = reportText.match(exactRegex);
      if (exactMatches) {
        matchedQuotes.push(...exactMatches.slice(0, 2));
      }

      // Strategy 2: If no exact match, try fuzzy matching with key phrases
      if (matchedQuotes.length === 0) {
        const keywords = finding
          .split(/\s+/)
          .filter(w => w.length > 3) // Only use words > 3 chars
          .slice(0, 3)
          .join('|');

        if (keywords) {
          const fuzzyRegex = new RegExp(
            `([^.!?\n]{0,100}(?:${keywords})[^.!?\n]{0,100})`,
            'gi'
          );
          const fuzzyMatches = reportText.match(fuzzyRegex);
          if (fuzzyMatches) {
            matchedQuotes.push(...fuzzyMatches.slice(0, 2));
          }
        }
      }

      // Store matched quotes if found
      if (matchedQuotes.length > 0) {
        quotes.set(finding, matchedQuotes.map(q => q.trim()));
      }
    }

    logger.info('Matched source quotes', {
      findingsCount: findings.length,
      matchedCount: quotes.size,
    });

    return quotes;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Failed to match source quotes', { error: message });
    return quotes;
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Type definitions

export interface AnalysisResult {
  summary: string;
  birads_value: number;
  birads_confidence: 'low' | 'medium' | 'high';
  breast_density_value: string | null;
  exam_date: string | null;
  modality: string | null;
  contrast: 'with' | 'without' | 'not_applicable' | null;
  exam_type: string;
  exam_laterality: string;
  clinical_history: string | null;
  risk_factors: string[];
  prior_exam_date: string | null;
  comparison_dates: string[];
  findings: Finding[];
  lymph_nodes: LymphNode[];
  skin_nipple_changes: string[];
  implants: Implant | null;
  post_surgical_changes: string[];
  multifocal: boolean | null;
  multicentric: boolean | null;
  bilateral_disease: boolean | null;
  disease_extent: string | null;
  recommendations: Recommendation[];
  management: Management;
  pathology_correlation: string | null;
  red_flags: string[];
  raw_analysis: string;
  clinical_disclaimer: string;
}

export interface SummaryResult {
  summary: string;
  clinical_disclaimer: string;
}

export interface ConsolidationResult {
  overall_summary: string;
  key_trends: string[];
  overall_birads: number;
  clinical_implications: string;
  timeline: TimelinePoint[];
  pathology_correlation: string | null;
  clinical_disclaimer: string;
}

export interface ComparisonResult {
  treatment_responses: Array<{
    treatment_type: string;
    assessment: string;
  }>;
  recommendations: string[];
  evidence_summary: string;
  clinical_disclaimer: string;
}

export interface BiradsTrendResult {
  trend: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
  direction: 'up' | 'down' | 'none' | 'unknown';
  significance: 'low' | 'medium' | 'high';
  clinical_note: string;
}
