import { deidentify } from '../services/deidentify.js';

describe('deidentify', () => {
  describe('regex layer — structured identifiers', () => {
    it('redacts a labelled MRN', () => {
      expect(deidentify('Patient MRN: 12345678 on file.')).toContain(
        'MRN: [REDACTED]'
      );
    });

    it('redacts an SSN', () => {
      expect(deidentify('SSN: 123-45-6789')).toBe('SSN: [REDACTED]');
    });

    it('redacts a labelled date of birth', () => {
      expect(deidentify('DOB: 01/15/1980')).toBe('DOB: [REDACTED]');
    });

    it('redacts a labelled phone number', () => {
      expect(deidentify('Phone: 555-123-4567')).toContain('Phone: [REDACTED]');
    });

    it('redacts an email address', () => {
      const result = deidentify('Contact jane.doe@example.com for results.');
      expect(result).not.toContain('jane.doe@example.com');
      expect(result).toContain('[REDACTED]');
    });

    it('redacts a labelled patient ID', () => {
      expect(deidentify('Patient ID: ABC12345')).toContain(
        'Patient ID: [REDACTED]'
      );
    });
  });

  describe('NER layer — names and facilities', () => {
    it('redacts a Title-cased patient name', () => {
      const result = deidentify('John Smith presented for screening.');
      expect(result).not.toMatch(/John|Smith/);
      expect(result).toContain('[REDACTED]');
      expect(result).toContain('presented for screening');
    });

    it('collapses a multi-word name into a single token', () => {
      const result = deidentify('Seen by John Smith today.');
      expect(result).toBe('Seen by [REDACTED] today.');
    });

    it('keeps the honorific and redacts the provider name', () => {
      const result = deidentify('Follow-up with Dr. Anderson.');
      expect(result).toContain('Dr.');
      expect(result).not.toContain('Anderson');
      expect(result).toContain('[REDACTED]');
    });
  });

  describe('preserves clinical content', () => {
    it('does not redact ALL-CAPS clinical acronyms', () => {
      const result = deidentify('BI-RADS 4 mass; MRI recommended.');
      expect(result).toContain('BI-RADS');
      expect(result).toContain('MRI');
    });

    it('does not redact the common word "Patient" or month names', () => {
      const result = deidentify('Patient to return in January.');
      expect(result).toContain('Patient');
      expect(result).toContain('January');
    });

    it('leaves text with no PHI unchanged', () => {
      const text = 'Stable benign cyst in the left breast.';
      expect(deidentify(text)).toBe(text);
    });
  });

  describe('edge cases', () => {
    it('handles an empty string', () => {
      expect(deidentify('')).toBe('');
    });
  });
});
