import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { deidentifyText, validateDeidentification } from './deidentificationService';

// Import types locally since shared package uses relative paths
interface Finding {
  laterality: string;
  location: string;
  description: string;
  assessment: string;
  evidence: string[];
}

interface Recommendation {
  action: string;
  timeframe: string;
  evidence: string[];
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Main analysis function that extracts key clinical data from a radiology report
 */
export async function analyzeReport(reportText: string): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    // De-identify text before sending to Claude API
    const deidentifiedText = deidentifyText(reportText);

    // Validate de-identification to ensure no PHI remains
    const validation = validateDeidentification(deidentifiedText);
    if (!validation.isValid) {
      logger.warn('De-identified text contains potential PHI - proceeding with caution', {
        remainingPatterns: validation.patternsFound,
      });
    }

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

Return a valid JSON object with these fields. Provide evidence for key assertions.

IMPORTANT: The report text has been de-identified for privacy. Patient names, dates of birth, medical record numbers, and other identifying information have been replaced with placeholders. Focus your analysis on clinical findings and medical data only.`;

    const userPrompt = `Please analyze this radiology report:\n\n${deidentifiedText}`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    const processingTime = Date.now() - startTime;
    logger.info('Successfully analyzed report with Claude', { processingTime });

    return {
      summary: analysisData.summary || '',
      birads_value: analysisData.birads_value || 0,
      birads_confidence: analysisData.birads_confidence || 'low',
      breast_density_value: analysisData.breast_density || '',
      exam_type: analysisData.exam_type || 'unknown',
      exam_laterality: analysisData.laterality || 'bilateral',
      comparison_prior_exam_date: analysisData.prior_exam_date || null,
      findings: normalizeFindings(analysisData.findings || []),
      recommendations: normalizeRecommendations(analysisData.recommendations || []),
      red_flags: analysisData.red_flags || [],
      raw_analysis: responseText,
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
export async function generateSummary(reportText: string): Promise<string> {
  try {
    // De-identify text before sending to Claude API
    const deidentifiedText = deidentifyText(reportText);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        'You are a clinical summarizer. Create a concise, one-paragraph summary of the key findings. Note: The report has been de-identified for privacy protection.',
      messages: [
        {
          role: 'user',
          content: `Summarize this radiology report:\n\n${deidentifiedText}`,
        },
      ],
    });

    const summary =
      response.content[0].type === 'text' ? response.content[0].text : '';
    logger.info('Successfully generated summary');
    return summary;
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
    // De-identify all reports before consolidation
    const deidentifiedReports = reports.map((r) => ({
      ...r,
      text: deidentifyText(r.text),
    }));

    const reportsText = deidentifiedReports
      .map((r) => `Date: ${r.date}\n${r.text}`)
      .join('\n\n---\n\n');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: `You are a clinical consolidator. Review multiple radiology reports and create:
1. An overall patient summary
2. Key trends in findings
3. Overall BI-RADS assessment
4. Clinical implications

Return valid JSON with fields: overall_summary, key_trends, overall_birads, clinical_implications

IMPORTANT: The reports have been de-identified for privacy protection. Patient identifiers and dates have been replaced with placeholders.`,
      messages: [
        {
          role: 'user',
          content: `Consolidate these reports:\n\n${reportsText}`,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from consolidation response');
    }

    const consolidation = JSON.parse(jsonMatch[0]);
    logger.info('Successfully consolidated reports');

    return {
      overall_summary: consolidation.overall_summary || '',
      key_trends: consolidation.key_trends || [],
      overall_birads: consolidation.overall_birads || 0,
      clinical_implications: consolidation.clinical_implications || '',
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
    // De-identify report text before sending to Claude API
    const deidentifiedText = deidentifyText(reportText);

    const treatmentsText = treatments
      .map(
        (t) =>
          `Type: ${t.type}, Outcome: ${t.outcome || 'Unknown'}`
      )
      .join('\n');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: `You are a clinical expert. Compare treatments against the current radiology findings.
Return valid JSON with:
- treatment_responses (array with treatment_type and assessment)
- recommendations (array of clinical recommendations)
- evidence_summary (string summarizing supporting evidence)

IMPORTANT: The report has been de-identified for privacy protection.`,
      messages: [
        {
          role: 'user',
          content: `Report findings:\n${deidentifiedText}\n\nTreatments:\n${treatmentsText}`,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from comparison response');
    }

    const comparison = JSON.parse(jsonMatch[0]);
    logger.info('Successfully compared treatments');

    return {
      treatment_responses: comparison.treatment_responses || [],
      recommendations: comparison.recommendations || [],
      evidence_summary: comparison.evidence_summary || '',
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

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: `Analyze BI-RADS trend. Return JSON with:
- trend (improving/worsening/stable/insufficient_data)
- direction (up/down/none)
- significance (low/medium/high)
- clinical_note (brief explanation)`,
      messages: [
        {
          role: 'user',
          content: `Analyze this BI-RADS trend:\n${valuesText}`,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        trend: 'insufficient_data',
        direction: 'unknown',
        significance: 'low',
        clinical_note: 'Failed to analyze trend data',
      };
    }

    const trendData = JSON.parse(jsonMatch[0]);
    logger.info('Successfully detected BI-RADS trend');

    return {
      trend: trendData.trend || 'insufficient_data',
      direction: trendData.direction || 'unknown',
      significance: trendData.significance || 'low',
      clinical_note: trendData.clinical_note || '',
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
 * Match source quotes from the original text
 */
export async function matchSourceQuotes(
  findings: string[],
  reportText: string
): Promise<Map<string, string[]>> {
  const quotes = new Map<string, string[]>();

  try {
    for (const finding of findings) {
      // Simple keyword extraction approach
      const keywords = finding.split(/\s+/).slice(0, 5).join(' ');
      const regex = new RegExp(
        `([^.\n]*${keywords}[^.\n]*)`,
        'gi'
      );
      const matches = reportText.match(regex);

      if (matches) {
        quotes.set(finding, matches.slice(0, 3));
      }
    }

    logger.info('Matched source quotes', { findingsCount: findings.length });
    return quotes;
  } catch (error) {
    logger.warn('Failed to match source quotes');
    return quotes;
  }
}

// Helper functions

function normalizeFindings(findingsData: unknown[]): Finding[] {
  return (findingsData || []).map((f: any) => ({
    laterality: f.laterality || 'unknown',
    location: f.location || '',
    description: f.description || '',
    assessment: f.assessment || '',
    evidence: Array.isArray(f.evidence) ? f.evidence : [],
  }));
}

function normalizeRecommendations(
  recommendationsData: unknown[]
): Recommendation[] {
  return (recommendationsData || []).map((r: any) => ({
    action: r.action || '',
    timeframe: r.timeframe || '',
    evidence: Array.isArray(r.evidence) ? r.evidence : [],
  }));
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
}

export interface ConsolidationResult {
  overall_summary: string;
  key_trends: string[];
  overall_birads: number;
  clinical_implications: string;
}

export interface ComparisonResult {
  treatment_responses: Array<{
    treatment_type: string;
    assessment: string;
  }>;
  recommendations: string[];
  evidence_summary: string;
}

export interface BiradsTrendResult {
  trend: 'improving' | 'worsening' | 'stable' | 'insufficient_data';
  direction: 'up' | 'down' | 'none' | 'unknown';
  significance: 'low' | 'medium' | 'high';
  clinical_note: string;
}
