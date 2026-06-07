/**
 * Local de-identification — strips PHI from report text entirely in-process, so no
 * patient identifiers are ever sent to Anthropic.
 *
 * Two layers, applied in order:
 *   1. Regex layer — labelled structured identifiers (MRN, SSN, DOB, phone, email,
 *      patient ID, insurance/policy numbers) are replaced with [REDACTED].
 *   2. NER layer — wink-nlp POS tagging flags Title-cased proper nouns (names and
 *      facilities) and redacts consecutive runs as a single [REDACTED]. An allowlist
 *      of common clinical proper nouns (e.g. BI-RADS) is preserved, and all-lowercase
 *      / ALL-CAPS acronyms are left intact to avoid stripping clinical content.
 *
 * Known limitation: POS-based name detection is heuristic. ALL-CAPS facility names and
 * names that the tagger misses can slip through; clinical Title-cased eponyms not in the
 * allowlist may be over-redacted. Tune ALLOWLIST as needed.
 */
import winkNLP, { type ItemToken } from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import { logger } from '../utils/logger.js';

const nlp = winkNLP(model);
const its = nlp.its;

const REDACTED = '[REDACTED]';

/**
 * Title-cased proper nouns that are clinical/common terms or titles rather than PHI.
 * Entries are normalised to lowercase letters only (see `normalize`); extend as
 * false positives surface.
 */
const ALLOWLIST = new Set<string>([
  // Common report words that can be tagged as proper nouns sentence-initially.
  'patient',
  // Honorifics/titles — keep the title, redact the name that follows.
  'dr',
  'doctor',
  'mr',
  'mrs',
  'ms',
  // Clinical terms / modalities.
  'birads',
  'mammography',
  'ultrasound',
  'mri',
  'ct',
  'pet',
  // Months and weekdays — scheduling context, weak identifiers on their own.
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

/** Normalise a token to lowercase letters only for allowlist comparison. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

/** Apply deterministic regex redaction of labelled structured identifiers. */
function applyRegexRedaction(text: string): string {
  return text
    .replace(
      /\b(?:MRN|Medical Record Number|Record #|Acct #|Account #)[:\s]+([A-Z0-9-]{4,20})/gi,
      'MRN: [REDACTED]'
    )
    .replace(
      /\b(?:SSN|Social Security)[:\s]+(\d{3}-\d{2}-\d{4})/gi,
      'SSN: [REDACTED]'
    )
    .replace(
      /\b(?:DOB|Date of Birth|Born)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2})/gi,
      'DOB: [REDACTED]'
    )
    .replace(
      /\b(?:Phone|Tel)[:\s]*\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/gi,
      'Phone: [REDACTED]'
    )
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED]')
    .replace(
      /\b(?:Patient ID|PID|PT ID)[:\s]+([A-Z0-9-]{5,15})/gi,
      'Patient ID: [REDACTED]'
    )
    .replace(
      /\b(?:Policy|Insurance|Group)[:\s]+([A-Z0-9-]{6,20})/gi,
      'Policy: [REDACTED]'
    );
}

/** True for a Title-cased token (initial capital followed by a lowercase letter). */
function looksLikeName(value: string): boolean {
  return /^[A-Z][a-z]/.test(value);
}

/**
 * Redact proper-noun names/facilities via POS tagging, collapsing consecutive
 * proper nouns into one [REDACTED] while preserving original whitespace.
 *
 * Sentence-initial proper nouns are only redacted when they begin a multi-token
 * name run (e.g. "John Smith"). A lone capitalised word at the start of a sentence
 * (e.g. "Stable", "Findings") is a common false positive from the POS tagger and is
 * kept — the regex layer already handles labelled identifiers.
 */
function redactNames(text: string): string {
  const doc = nlp.readDoc(text);

  const tokens: Array<{ preceding: string; value: string; name: boolean }> = [];
  doc.tokens().each((token: ItemToken) => {
    const value = token.out();
    const pos = token.out(its.pos);
    tokens.push({
      preceding: token.out(its.precedingSpaces),
      value,
      name:
        pos === 'PROPN' &&
        looksLikeName(value) &&
        !ALLOWLIST.has(normalize(value)),
    });
  });

  const isSentenceStart = (i: number): boolean =>
    i === 0 || /^[.!?]$/.test(tokens[i - 1].value);

  let result = '';
  let inRun = false;

  for (let i = 0; i < tokens.length; i++) {
    const { preceding, value, name } = tokens[i];
    const redact =
      name && (!isSentenceStart(i) || (tokens[i + 1]?.name ?? false));

    if (redact) {
      if (!inRun) {
        result += preceding + REDACTED;
        inRun = true;
      }
      // Consecutive redacted tokens collapse into the single [REDACTED] above.
    } else {
      result += preceding + value;
      inRun = false;
    }
  }

  return result;
}

/**
 * De-identify report text locally (regex + NER). Synchronous and self-contained;
 * no network calls. Returns text with PHI replaced by [REDACTED] tokens.
 */
export function deidentify(text: string): string {
  const afterRegex = applyRegexRedaction(text);
  const deidentified = redactNames(afterRegex);

  logger.info('De-identified text locally', {
    originalLength: text.length,
    cleanedLength: deidentified.length,
  });

  return deidentified;
}
