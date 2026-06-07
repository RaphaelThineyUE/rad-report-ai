import { deidentify } from '../services/deidentify.js';

describe('deidentify', () => {
  describe('patient name (labelled fields only)', () => {
    it('redacts a labelled patient name, keeping the label', () => {
      expect(deidentify('Patient Name: John Smith')).toBe(
        'Patient Name: [REDACTED]'
      );
    });

    it('redacts a "Patient:" name and stops at the next field', () => {
      expect(deidentify('Patient: SMITH, JOHN   MRN: 12345678')).toBe(
        'Patient: [REDACTED]   MRN: [REDACTED]'
      );
    });

    it('does not redact when the value is not a name (e.g. age)', () => {
      const text = 'Patient: 45-year-old woman with a palpable lump.';
      expect(deidentify(text)).toBe(text);
    });

    it('keeps provider names in the narrative', () => {
      const text = 'Study read by Dr. Anderson and reviewed by Dr. Lee.';
      expect(deidentify(text)).toBe(text);
    });

    it('keeps facility names', () => {
      const text = 'Performed at Johns Hopkins Hospital.';
      expect(deidentify(text)).toBe(text);
    });
  });

  describe('dates', () => {
    it('redacts a labelled date of birth', () => {
      expect(deidentify('DOB: 01/15/1980')).toBe('DOB: [REDACTED]');
    });

    it('keeps exam and follow-up dates', () => {
      const text =
        'Exam date: 03/15/2024. Compared to prior 03/10/2022. Follow-up in 6 months.';
      expect(deidentify(text)).toBe(text);
    });
  });

  describe('addresses', () => {
    it('redacts a street address', () => {
      const result = deidentify('Lives at 123 Main Street, Apt 4B.');
      expect(result).not.toContain('123 Main Street');
      expect(result).toContain('[REDACTED]');
    });

    it('redacts a city/state/ZIP line', () => {
      const result = deidentify('Boston, MA 02115');
      expect(result).toBe('[REDACTED]');
    });
  });

  describe('non-clinical direct identifiers', () => {
    it('redacts an MRN', () => {
      expect(deidentify('MRN: 12345678')).toBe('MRN: [REDACTED]');
    });

    it('redacts an SSN', () => {
      expect(deidentify('SSN: 123-45-6789')).toBe('SSN: [REDACTED]');
    });

    it('redacts an email address', () => {
      const result = deidentify('Contact jane.doe@example.com.');
      expect(result).not.toContain('jane.doe@example.com');
    });

    it('redacts a phone number', () => {
      expect(deidentify('Phone: 555-123-4567')).toContain('Phone: [REDACTED]');
    });
  });

  describe('preserves clinical content', () => {
    it('keeps BI-RADS, measurements, and findings intact', () => {
      const text =
        'BI-RADS 4. Irregular spiculated mass measuring 12 mm at 10 o\'clock, ' +
        '4 cm from the nipple. MRI recommended.';
      expect(deidentify(text)).toBe(text);
    });

    it('leaves text with no PHI unchanged', () => {
      const text = 'Stable benign cyst in the left breast.';
      expect(deidentify(text)).toBe(text);
    });

    it('handles an empty string', () => {
      expect(deidentify('')).toBe('');
    });
  });
});
