/**
 * Local de-identification — strips PHI from report text entirely in-process, so no
 * patient identifiers are ever sent to Anthropic.
 *
 * Scope is intentionally minimal so that clinically valuable data survives. Only the
 * following are redacted:
 *   - Patient name, when it appears in a labelled field ("Patient:", "Patient Name:",
 *     "Pt:"). Provider and facility names in the narrative are deliberately KEPT.
 *   - Date of birth (labelled). All other dates — exam, follow-up, comparison — are KEPT.
 *   - Street addresses and city/state/ZIP lines.
 *   - Non-clinical direct identifiers with no diagnostic value: MRN, SSN, phone, email,
 *     patient ID, insurance/policy numbers.
 *
 * Everything else — exam dates, BI-RADS, measurements, morphology, provider/facility
 * names, etc. — is left intact for the structured-output stage.
 *
 * This is deterministic (regex only); there is no NLP/NER model. Limitation: a patient
 * name that appears unlabelled in the body is not detected. Tune the patterns/labels as
 * report formats vary.
 */
import { logger } from '../utils/logger.js';

const REDACTED = '[REDACTED]';

// Capitalised name token (Title-case word, ALL-CAPS word, or single initial like "A."),
// excluding common field-label keywords so the capture stops at the next field.
const STOP_LABELS = 'MRN|DOB|DOS|SSN|DATE|SEX|AGE|GENDER|EXAM|PHONE|TEL|FAX|ACCT|ACCOUNT|ID';
const NAME_TOKEN = `(?!(?:${STOP_LABELS})\\b)(?:[A-Z][a-z]+|[A-Z]{2,}|[A-Z]\\.)`;
// 1–5 name tokens separated by spaces/commas.
const NAME_VALUE = `(?:${NAME_TOKEN})(?:[,\\s]+${NAME_TOKEN}){0,4}`;
// Patient-name label (Title-case or UPPERCASE variants) + separator, capturing the name.
const PATIENT_NAME = new RegExp(
  `\\b((?:Patient(?:'s)?\\s+Name|PATIENT(?:'S)?\\s+NAME|Patient|PATIENT|Pt|PT)\\s*[:#]\\s*)(${NAME_VALUE})`,
  'g'
);

const STREET_SUFFIX =
  'Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Terrace|Ter|Circle|Cir|Highway|Hwy|Parkway|Pkwy';

/** Redact the labelled patient name, addresses, DOB, and non-clinical direct identifiers. */
export function deidentify(text: string): string {
  const deidentified = text
    // Patient name in a labelled field — keep the label, redact the value.
    .replace(PATIENT_NAME, `$1${REDACTED}`)

    // Addresses: street line, then city/state/ZIP, then labelled address line.
    .replace(
      new RegExp(
        `\\b\\d{1,6}\\s+(?:[A-Za-z0-9.'#-]+\\s+){0,5}(?:${STREET_SUFFIX})\\b\\.?(?:\\s+(?:Apt|Suite|Ste|Unit|Rm|#)\\.?\\s*\\w+)?`,
        'g'
      ),
      REDACTED
    )
    .replace(
      /\b[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g,
      REDACTED
    )
    .replace(/\b(?:Address|Addr)\s*[:#]\s*.+/gi, `Address: ${REDACTED}`)

    // Date of birth (labelled) — the only date that is redacted.
    .replace(
      /\b(?:DOB|Date of Birth|Born)[:\s]+(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2})/gi,
      `DOB: ${REDACTED}`
    )

    // Non-clinical direct identifiers (no diagnostic value).
    .replace(
      /\b(?:MRN|Medical Record Number|Record #|Acct #|Account #)[:\s]+([A-Z0-9-]{4,20})/gi,
      `MRN: ${REDACTED}`
    )
    .replace(/\b(?:SSN|Social Security)[:\s]+\d{3}-\d{2}-\d{4}/gi, `SSN: ${REDACTED}`)
    .replace(
      /\b(?:Phone|Tel)[:\s]*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi,
      `Phone: ${REDACTED}`
    )
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, REDACTED)
    .replace(
      /\b(?:Patient ID|PID|PT ID)[:\s]+([A-Z0-9-]{5,15})/gi,
      `Patient ID: ${REDACTED}`
    )
    .replace(
      /\b(?:Policy|Insurance|Group)[:\s]+([A-Z0-9-]{6,20})/gi,
      `Policy: ${REDACTED}`
    );

  logger.info('De-identified text locally', {
    originalLength: text.length,
    cleanedLength: deidentified.length,
  });

  return deidentified;
}
