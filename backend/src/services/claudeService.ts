import Anthropic from '@anthropic-ai/sdk';
import { env } from '../utils/env.js';
import type { ClaudeReportAnalysis, TreatmentComparisonResult } from '../models/types.js';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const reportSystemPrompt =
  'You are a medical AI assistant specializing in breast radiology report analysis. Always respond with valid JSON only. No preamble or markdown.';
const summarySystemPrompt =
  'You are a compassionate medical communicator. Respond with plain text only, 2-4 sentences.';
const consolidateSystemPrompt =
  'You are a senior breast radiologist AI. Respond with plain text paragraphs only.';
const comparisonSystemPrompt =
  'You are an oncology decision-support AI. Respond with valid JSON only.';

const getTextContent = (response: Awaited<ReturnType<typeof anthropic.messages.create>>) =>
  ('content' in response ? response.content : [])
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

const parseJson = <T>(raw: string): T => JSON.parse(raw) as T;

export const analyzeReportText = async (pdfText: string) => {
  const response = await anthropic.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 1000,
    system: reportSystemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this breast radiology report and extract structured data.\n\nReport text: ${pdfText}\n\nReturn JSON:\n{\n  "birads": { "value": 0-6, "confidence": "low|medium|high", "evidence": ["exact quote"] },\n  "breast_density": { "value": "A|B|C|D", "evidence": ["exact quote"] },\n  "exam": { "type": "string", "laterality": "string", "evidence": ["exact quote"] },\n  "comparison": { "prior_exam_date": "string|null", "evidence": ["exact quote"] },\n  "findings": [{ "laterality": "string", "location": "string", "description": "string", "assessment": "string", "evidence": ["exact quote"] }],\n  "recommendations": [{ "action": "string", "timeframe": "string", "evidence": ["exact quote"] }],\n  "red_flags": ["string"]\n}`,
      },
    ],
  });

  return parseJson<ClaudeReportAnalysis>(getTextContent(response));
};

export const generatePatientSummary = async (extractedJson: unknown) => {
  const response = await anthropic.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 1000,
    system: summarySystemPrompt,
    messages: [
      {
        role: 'user',
        content:
          'Create a patient-friendly summary explaining key findings, what the BI-RADS score means, and what the patient should know next. Be honest but reassuring.\n\nData: ' +
          JSON.stringify(extractedJson),
      },
    ],
  });

  return getTextContent(response);
};

export const consolidateReports = async (reports: unknown[], patient: unknown) => {
  const response = await anthropic.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 2000,
    system: consolidateSystemPrompt,
    messages: [
      {
        role: 'user',
        content:
          'Analyze these multiple breast radiology reports for the same patient. Write 3-5 paragraphs covering: overall assessment, disease progression, consistent findings, concerning patterns, and recommendations.\n\nReports: ' +
          JSON.stringify(reports) +
          '\n\nPatient: ' +
          JSON.stringify(patient),
      },
    ],
  });

  return getTextContent(response);
};

export const compareTreatments = async (patient: unknown, treatmentOptions: unknown[]) => {
  const response = await anthropic.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 1000,
    system: comparisonSystemPrompt,
    messages: [
      {
        role: 'user',
        content:
          'Compare these treatment options for this patient. For each option return: score (1-10), efficacy, benefits, side_effects, duration, considerations. Add an overall_recommendation string and a disclaimer.\n\nPatient: ' +
          JSON.stringify(patient) +
          '\n\nOptions: ' +
          JSON.stringify(treatmentOptions),
      },
    ],
  });

  return parseJson<TreatmentComparisonResult>(getTextContent(response));
};
