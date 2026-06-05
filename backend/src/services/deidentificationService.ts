import { logger } from '../utils/logger';

/**
 * De-identification service for removing PHI (Protected Health Information)
 * from radiology reports before sending to Claude API
 */

interface PHIPattern {
  regex: RegExp;
  placeholder: string;
  description: string;
}

/**
 * Define all PHI patterns to be de-identified
 * Patterns are applied in order for accuracy and to avoid overlapping replacements
 * NOTE: Order matters - more specific patterns should come before more general ones
 */
const PHI_PATTERNS: PHIPattern[] = [
  // Street addresses: Number + Street Name + Type (more specific - check before names)
  {
    regex: /\b\d+\s+(?:[A-Z][a-z]*\s+)*(?:Street|St\.?|Road|Rd\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Circle|Ct\.?|Court|Way|Parkway|Pkwy\.?|Place|Pl\.?)\b/gi,
    placeholder: '[ADDRESS]',
    description: 'Street address',
  },
  // Social Security Numbers: XXX-XX-XXXX or XXXXXXXXX
  {
    regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    placeholder: '[SSN]',
    description: 'Social Security Number',
  },
  // Phone numbers: (555) 123-4567 or 555-123-4567 or 5551234567
  {
    regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    placeholder: '[PHONE]',
    description: 'Phone number',
  },
  // Email addresses: name@domain.com
  {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    placeholder: '[EMAIL]',
    description: 'Email address',
  },
  // Dates of birth in format YYYY-MM-DD
  {
    regex: /\b(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g,
    placeholder: '[DATE]',
    description: 'Date of birth (YYYY-MM-DD)',
  },
  // Dates in format MM/DD/YYYY
  {
    regex: /\b(0[1-9]|1[0-2])\/([0-2]\d|3[01])\/(19|20)\d{2}\b/g,
    placeholder: '[DATE]',
    description: 'Date (MM/DD/YYYY)',
  },
  // Dates in format DD/MM/YYYY (less common but included)
  {
    regex: /\b([0-2]\d|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}\b/g,
    placeholder: '[DATE]',
    description: 'Date (DD/MM/YYYY)',
  },
  // Medical Record Numbers: MRN-12345 or MRN12345
  {
    regex: /\b(?:MRN|Medical\s+Record\s+Number|Chart\s+Number|Account\s+Number)[-:\s]*[A-Z0-9]{4,}\b/gi,
    placeholder: '[MRN]',
    description: 'Medical Record Number',
  },
  // Health Plan/Insurance ID numbers (simplified pattern)
  {
    regex: /\b(?:Insurance\s+ID|Policy\s+Number|Member\s+ID|Group\s+Number|ID)[-:\s]+[A-Z0-9\-]{5,}\b/gi,
    placeholder: '[INSURANCE_ID]',
    description: 'Insurance ID number',
  },
  // Zip codes: XXXXX or XXXXX-XXXX (check before names to avoid partial matches)
  {
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    placeholder: '[ZIP]',
    description: 'Zip code',
  },
  // Names: Common pattern (Capitalized First Last names) - check last to avoid false positives
  // More conservative: require "Patient:" or context
  {
    regex: /(?:Patient|Name|Dr\.?)\s*[:.]?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/gi,
    placeholder: '[PATIENT_NAME]',
    description: 'Patient name',
  },
];

/**
 * Track patient identifiers for reference and re-identification
 */
export interface IdentifierEntry {
  original: string;
  replacement: string;
  type: string;
  position: number;
}

/**
 * De-identify text by replacing PHI with placeholders
 * @param text - The raw text to de-identify
 * @returns De-identified text with PHI replaced by placeholders
 */
export function deidentifyText(text: string): string {
  let deidentifiedText = text;

  // Apply each pattern in order
  for (const pattern of PHI_PATTERNS) {
    deidentifiedText = deidentifiedText.replace(pattern.regex, pattern.placeholder);
  }

  logger.info('Text de-identified', {
    originalLength: text.length,
    deidentifiedLength: deidentifiedText.length,
  });

  return deidentifiedText;
}

/**
 * Create a mapping of original PHI values to their replacements
 * This is useful for auditing and ensuring no data loss
 * @param text - The original text to analyze
 * @returns Map of original PHI values to their types
 */
export function createIdentifierMap(text: string): Map<string, string> {
  const identifierMap = new Map<string, string>();

  // Extract and track all identified PHI
  for (const pattern of PHI_PATTERNS) {
    const matches = text.match(pattern.regex) || [];
    for (const match of matches) {
      // Store unique identifiers by type
      const key = `${pattern.placeholder}:${match}`;
      if (!identifierMap.has(match)) {
        identifierMap.set(match, pattern.placeholder);
      }
    }
  }

  logger.info('Identifier map created', {
    uniqueIdentifiers: identifierMap.size,
  });

  return identifierMap;
}

/**
 * Re-identify text by restoring original PHI values
 * WARNING: This should only be used for internal processing and display
 * Never expose re-identified data to external systems
 * @param deidentifiedText - Text with placeholders
 * @param identifierMap - Map of original values to replacements
 * @returns Text with original PHI restored
 */
export function reidentifyText(
  deidentifiedText: string,
  identifierMap: Map<string, string>
): string {
  let reidentifiedText = deidentifiedText;

  // Restore original values in reverse order to avoid conflicts
  const entries = Array.from(identifierMap.entries());
  for (const [original, replacement] of entries) {
    // Only replace if we have a reasonable number of occurrences
    // to avoid false positives
    const regex = new RegExp(
      `\\${replacement}(?!\\w)`,
      'g'
    );
    reidentifiedText = reidentifiedText.replace(regex, original);
  }

  logger.info('Text re-identified', {
    identifiersRestored: identifierMap.size,
  });

  return reidentifiedText;
}

/**
 * Validate that no PHI patterns remain in text
 * Useful for quality assurance before sending to Claude
 * @param text - Text to validate
 * @returns Object with validation result and any remaining PHI found
 */
export function validateDeidentification(text: string): {
  isValid: boolean;
  remainingPHI: string[];
  patternsFound: number;
} {
  const remainingPHI: string[] = [];
  let patternsFound = 0;

  for (const pattern of PHI_PATTERNS) {
    const matches = text.match(pattern.regex) || [];
    if (matches.length > 0) {
      patternsFound++;
      // Only log first few matches for each pattern to avoid excessive logging
      remainingPHI.push(
        ...matches.slice(0, 3).map(m => `${pattern.description}: ${m}`)
      );
    }
  }

  const isValid = remainingPHI.length === 0;

  if (!isValid) {
    logger.warn('De-identified text still contains PHI patterns', {
      patternsFound,
      samplePHI: remainingPHI.slice(0, 5),
    });
  } else {
    logger.info('De-identification validation passed', { textLength: text.length });
  }

  return {
    isValid,
    remainingPHI,
    patternsFound,
  };
}

/**
 * De-identify multiple text chunks efficiently
 * @param texts - Array of text strings to de-identify
 * @returns Array of de-identified texts
 */
export function deidentifyBatch(texts: string[]): string[] {
  return texts.map(text => deidentifyText(text));
}

/**
 * Get de-identification statistics
 * @param originalText - Original text
 * @param deidentifiedText - De-identified text
 * @returns Statistics about the de-identification process
 */
export function getDeidentificationStats(
  originalText: string,
  deidentifiedText: string
): {
  totalCharactersProcessed: number;
  charactersRemoved: number;
  removalRate: number;
  estimatedPHICount: number;
} {
  const totalCharactersProcessed = originalText.length;
  const charactersRemoved = originalText.length - deidentifiedText.length;
  const removalRate =
    totalCharactersProcessed > 0
      ? (charactersRemoved / totalCharactersProcessed) * 100
      : 0;

  // Estimate PHI count by counting placeholder occurrences
  const placeholderCounts: Record<string, number> = {};
  for (const pattern of PHI_PATTERNS) {
    const matches = originalText.match(pattern.regex) || [];
    if (matches.length > 0) {
      placeholderCounts[pattern.placeholder] = matches.length;
    }
  }

  const estimatedPHICount = Object.values(placeholderCounts).reduce(
    (a, b) => a + b,
    0
  );

  return {
    totalCharactersProcessed,
    charactersRemoved,
    removalRate: Math.round(removalRate * 100) / 100,
    estimatedPHICount,
  };
}
