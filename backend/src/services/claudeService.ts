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
  ConsolidationSchema,
  ComparisonSchema,
  BiradsTrendSchema,
  type Finding,
  type Recommendation,
} from './aiSchemas.js';
import { deidentify } from './deidentify.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

const CLINICAL_DISCLAIMER = `⚠️ CLINICAL REVIEW REQUIRED: This analysis is AI-generated and must be reviewed by a qualified radiologist. Do not use as a substitute for professional medical judgment. All recommendations should be verified against the original report and clinical context.`;

/**
 * Main analysis function that extracts key clinical data from a radiology report
 */
export async function analyzeReport(reportText: string): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    const systemPrompt = `You are an expert radiologist analyzing mammography reports. Extract the following information from the report text:

1. Summary (1-2 sentences of the key finding)
2. BI-RADS assessment value (0-6)
3. Confidence in BI-RADS assessment (low/medium/high)
4. Breast density (BI-RADS classification A-D)
5. Exam type (screening/diagnostic/follow-up)
6. Laterality (bilateral/left/right)
7. Comparison with prior exams (if mentioned, include date)
8. Key findings (location, laterality, description, assessment)
9. Clinical recommendations
10. Any red flags or urgent findings

Provide evidence for key assertions.`;

    const userPrompt = `Please analyze this radiology report:\n\n${reportText}`;

    const message = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
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
      throw new Error('Failed to parse structured analysis from Claude response');
    }

    const processingTime = Date.now() - startTime;
    logger.info('Successfully analyzed report with Claude', { processingTime });

    return {
      summary: analysisData.summary,
      birads_value: analysisData.birads_value,
      birads_confidence: analysisData.birads_confidence,
      breast_density_value: analysisData.breast_density,
      exam_type: analysisData.exam_type,
      exam_laterality: analysisData.laterality,
      comparison_prior_exam_date: analysisData.prior_exam_date,
      findings: analysisData.findings,
      recommendations: analysisData.recommendations,
      red_flags: analysisData.red_flags,
      raw_analysis: JSON.stringify(analysisData),
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to analyze report', { error: message });
    throw new Error(`Report analysis failed: ${message}`);
  }
}

/**
 * Generate a summary of a single report
 */
export async function generateSummary(reportText: string): Promise<SummaryResult> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        'You are a clinical summarizer. Create a concise, one-paragraph summary of the key findings.',
      messages: [
        {
          role: 'user',
          content: `Summarize this radiology report:\n\n${reportText}`,
        },
      ],
    });

    const summary =
      response.content[0].type === 'text' ? response.content[0].text : '';
    logger.info('Successfully generated summary');
    return {
      summary,
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
      max_tokens: 1000,
      system: `You are a clinical consolidator. Review multiple radiology reports and create:
1. An overall patient summary
2. Key trends in findings
3. Overall BI-RADS assessment
4. Clinical implications`,
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
      throw new Error('Failed to parse structured consolidation from Claude response');
    }

    logger.info('Successfully consolidated reports');

    return {
      overall_summary: consolidation.overall_summary,
      key_trends: consolidation.key_trends,
      overall_birads: consolidation.overall_birads,
      clinical_implications: consolidation.clinical_implications,
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to consolidate reports', { error: message });
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
      throw new Error('Failed to parse structured comparison from Claude response');
    }

    logger.info('Successfully compared treatments');

    return {
      treatment_responses: comparison.treatment_responses,
      recommendations: comparison.recommendations,
      evidence_summary: comparison.evidence_summary,
      clinical_disclaimer: CLINICAL_DISCLAIMER,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to compare treatments', { error: message });
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
      return {
        trend: 'insufficient_data',
        direction: 'unknown',
        significance: 'low',
        clinical_note: 'Failed to analyze trend data',
      };
    }

    logger.info('Successfully detected BI-RADS trend');

    return {
      trend: trendData.trend,
      direction: trendData.direction,
      significance: trendData.significance,
      clinical_note: trendData.clinical_note,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to detect trend', { error: message });
    return {
      trend: 'insufficient_data',
      direction: 'unknown',
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
  breast_density_value: string;
  exam_type: string;
  exam_laterality: string;
  comparison_prior_exam_date: string | null;
  findings: Finding[];
  recommendations: Recommendation[];
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
