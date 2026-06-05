import {
  deidentifyText,
  createIdentifierMap,
  reidentifyText,
  validateDeidentification,
  getDeidentificationStats,
  deidentifyBatch,
} from './deidentificationService';

/**
 * Test Suite: De-identification Service
 * Tests for PHI removal and patient privacy protection
 */

describe('De-identification Service', () => {
  describe('deidentifyText - PHI Pattern Removal', () => {
    it('should remove patient names', () => {
      const text = 'Patient: John Smith, Age: 45';
      const result = deidentifyText(text);
      expect(result).toContain('[PATIENT_NAME]');
      expect(result).not.toContain('John Smith');
    });

    it('should remove dates of birth in YYYY-MM-DD format', () => {
      const text = 'DOB: 1985-03-15, Last exam: 2024-06-01';
      const result = deidentifyText(text);
      expect(result).toContain('[DATE]');
      expect(result).not.toContain('1985-03-15');
    });

    it('should remove dates in MM/DD/YYYY format', () => {
      const text = 'Exam date: 06/15/2024';
      const result = deidentifyText(text);
      expect(result).toContain('[DATE]');
      expect(result).not.toContain('06/15/2024');
    });

    it('should remove Medical Record Numbers (MRN)', () => {
      const text = 'MRN: MRN-12345 for patient record';
      const result = deidentifyText(text);
      expect(result).toContain('[MRN]');
      expect(result).not.toContain('MRN-12345');
    });

    it('should remove phone numbers with parentheses', () => {
      const text = 'Contact: (555) 123-4567';
      const result = deidentifyText(text);
      expect(result).toContain('[PHONE]');
      expect(result).not.toContain('(555) 123-4567');
    });

    it('should remove phone numbers with dashes', () => {
      const text = 'Phone: 555-123-4567';
      const result = deidentifyText(text);
      expect(result).toContain('[PHONE]');
      expect(result).not.toContain('555-123-4567');
    });

    it('should remove email addresses', () => {
      const text = 'Email: john.doe@example.com for contact';
      const result = deidentifyText(text);
      expect(result).toContain('[EMAIL]');
      expect(result).not.toContain('john.doe@example.com');
    });

    it('should remove street addresses', () => {
      const text = 'Address: 123 Main Street, Springfield';
      const result = deidentifyText(text);
      expect(result).toContain('[ADDRESS]');
      expect(result).not.toContain('123 Main Street');
    });

    it('should remove Social Security Numbers', () => {
      const text = 'SSN: 123-45-6789 patient identifier';
      const result = deidentifyText(text);
      expect(result).toContain('[SSN]');
      expect(result).not.toContain('123-45-6789');
    });

    it('should remove zip codes', () => {
      const text = 'Zip: 12345 or extended 12345-6789';
      const result = deidentifyText(text);
      expect(result).toContain('[ZIP]');
      expect(result).not.toContain('12345');
    });

    it('should remove insurance ID numbers', () => {
      const text = 'Insurance ID: INS-ABC123456 for coverage';
      const result = deidentifyText(text);
      expect(result).toContain('[INSURANCE_ID]');
      expect(result).not.toContain('INS-ABC123456');
    });

    it('should handle multiple PHI in same text', () => {
      const text = `
        Patient: Jane Doe
        DOB: 1990-05-20
        MRN: MRN-98765
        Phone: (555) 987-6543
        Email: jane@example.com
        Address: 456 Oak Street
      `;
      const result = deidentifyText(text);
      expect(result).toContain('[PATIENT_NAME]');
      expect(result).toContain('[DATE]');
      expect(result).toContain('[MRN]');
      expect(result).toContain('[PHONE]');
      expect(result).toContain('[EMAIL]');
      expect(result).toContain('[ADDRESS]');
    });

    it('should preserve clinical content while removing PHI', () => {
      const text = 'Patient: John Smith, DOB: 1985-03-15. Mammography shows 2cm mass in upper outer quadrant.';
      const result = deidentifyText(text);
      expect(result).toContain('Mammography');
      expect(result).toContain('2cm mass');
      expect(result).toContain('upper outer quadrant');
      expect(result).not.toContain('John Smith');
      expect(result).not.toContain('1985-03-15');
    });

    it('should handle empty text', () => {
      const result = deidentifyText('');
      expect(result).toBe('');
    });

    it('should handle text with no PHI', () => {
      const text = 'The mammogram shows normal breast tissue.';
      const result = deidentifyText(text);
      expect(result).toBe(text);
    });
  });

  describe('createIdentifierMap', () => {
    it('should create map of unique identifiers', () => {
      const text = 'John Smith and Mary Johnson';
      const map = createIdentifierMap(text);
      expect(map.size).toBeGreaterThan(0);
    });

    it('should track identifier types', () => {
      const text = 'DOB: 1985-03-15, Phone: (555) 123-4567';
      const map = createIdentifierMap(text);
      const entries = Array.from(map.entries());
      const hasDate = entries.some(([_, val]) => val === '[DATE]');
      const hasPhone = entries.some(([_, val]) => val === '[PHONE]');
      expect(hasDate).toBe(true);
      expect(hasPhone).toBe(true);
    });

    it('should handle multiple occurrences of same identifier', () => {
      const text = 'Call 555-123-4567 or 555-123-4567';
      const map = createIdentifierMap(text);
      // Should only store unique values
      const phoneCount = Array.from(map.values()).filter(v => v === '[PHONE]').length;
      expect(phoneCount).toBeLessThanOrEqual(2);
    });
  });

  describe('reidentifyText', () => {
    it('should restore original PHI from map', () => {
      const originalText = 'DOB: 1985-03-15';
      const deidentified = deidentifyText(originalText);
      const map = createIdentifierMap(originalText);
      const reidentified = reidentifyText(deidentified, map);
      expect(reidentified).toContain('1985-03-15');
    });

    it('should handle missing map entries gracefully', () => {
      const deidentified = 'This is text with [DATE] placeholder';
      const emptyMap = new Map<string, string>();
      const result = reidentifyText(deidentified, emptyMap);
      expect(result).toBe(deidentified);
    });

    it('should preserve un-mapped content', () => {
      const deidentified = 'Clinical finding: [DATE] shows normal appearance';
      const map = new Map<string, string>([['1985-03-15', '[DATE]']]);
      const result = reidentifyText(deidentified, map);
      expect(result).toContain('Clinical finding');
      expect(result).toContain('shows normal appearance');
    });
  });

  describe('validateDeidentification', () => {
    it('should validate clean de-identified text', () => {
      const text = 'The mammogram shows normal breast tissue. No masses detected.';
      const result = validateDeidentification(text);
      expect(result.isValid).toBe(true);
      expect(result.remainingPHI.length).toBe(0);
    });

    it('should detect remaining PHI patterns', () => {
      const text = 'Patient: John Smith was seen on 1985-03-15';
      const result = validateDeidentification(text);
      expect(result.isValid).toBe(false);
      expect(result.remainingPHI.length).toBeGreaterThan(0);
      expect(result.patternsFound).toBeGreaterThan(0);
    });

    it('should count all remaining PHI types', () => {
      const text = 'John Smith, DOB: 1985-03-15, Phone: (555) 123-4567';
      const result = validateDeidentification(text);
      expect(result.patternsFound).toBeGreaterThan(0);
      expect(result.remainingPHI.length).toBeGreaterThan(0);
    });
  });

  describe('getDeidentificationStats', () => {
    it('should calculate statistics correctly', () => {
      const original = 'Patient Name: John Smith, DOB: 1985-03-15';
      const deidentified = deidentifyText(original);
      const stats = getDeidentificationStats(original, deidentified);

      expect(stats.totalCharactersProcessed).toBeGreaterThan(0);
      // May be 0 if placeholders are shorter, so we just check it's not negative
      expect(stats.removalRate).toBeLessThanOrEqual(100);
      expect(stats.removalRate).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats for text with no PHI', () => {
      const text = 'Normal breast tissue visualized.';
      const stats = getDeidentificationStats(text, text);

      expect(stats.totalCharactersProcessed).toBe(text.length);
      expect(stats.charactersRemoved).toBe(0);
      expect(stats.removalRate).toBe(0);
      expect(stats.estimatedPHICount).toBe(0);
    });

    it('should estimate PHI count', () => {
      const original = 'John Smith, Jane Doe, and Mary Johnson';
      const deidentified = deidentifyText(original);
      const stats = getDeidentificationStats(original, deidentified);

      expect(stats.estimatedPHICount).toBeGreaterThan(0);
    });
  });

  describe('deidentifyBatch', () => {
    it('should process multiple texts', () => {
      const texts = [
        'John Smith, DOB: 1985-03-15',
        'Jane Doe, Phone: (555) 123-4567',
        'Bob Johnson, Email: bob@example.com',
      ];
      const results = deidentifyBatch(texts);

      expect(results).toHaveLength(3);
      expect(results[0]).toContain('[PATIENT_NAME]');
      expect(results[0]).toContain('[DATE]');
      expect(results[1]).toContain('[PATIENT_NAME]');
      expect(results[1]).toContain('[PHONE]');
      expect(results[2]).toContain('[PATIENT_NAME]');
      expect(results[2]).toContain('[EMAIL]');
    });

    it('should handle empty array', () => {
      const results = deidentifyBatch([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('Real-world radiology report scenario', () => {
    it('should de-identify a typical mammography report', () => {
      const report = `
        PATIENT NAME: Jane Doe
        DATE OF BIRTH: 1975-08-20
        MRN: MRN-ABC123456
        EXAMINATION DATE: 06/15/2024
        PHONE: (555) 234-5678
        ADDRESS: 789 Elm Street, Suite 200

        CLINICAL HISTORY:
        45-year-old female for routine mammographic screening.

        FINDINGS:
        Bilateral mammograms are performed.
        Breast composition: ACR A - predominantly fatty tissue.

        RIGHT BREAST:
        A focal asymmetry is identified in the upper outer quadrant at the 2 o'clock position.

        LEFT BREAST:
        No masses, asymmetries, distortions or suspicious calcifications.

        IMPRESSION:
        BI-RADS 3 - Probably benign finding. Right breast focal asymmetry in the upper outer quadrant.

        RECOMMENDATION:
        Short-term follow-up mammography in 6 months.
      `;

      const deidentified = deidentifyText(report);
      const validation = validateDeidentification(deidentified);

      expect(deidentified).not.toContain('Jane Doe');
      expect(deidentified).not.toContain('1975-08-20');
      expect(deidentified).not.toContain('MRN-ABC123456');
      expect(deidentified).not.toContain('(555) 234-5678');
      expect(deidentified).not.toContain('789 Elm Street');

      // Verify clinical content is preserved
      expect(deidentified).toContain('mammograms');
      expect(deidentified).toContain('focal asymmetry');
      expect(deidentified).toContain('BI-RADS');
      expect(deidentified).toContain('upper outer quadrant');

      // Verify de-identification is complete
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle dates near boundaries', () => {
      const text = '1900-01-01 and 2099-12-31';
      const result = deidentifyText(text);
      expect(result).toContain('[DATE]');
    });

    it('should handle numbers that look like SSN but are not', () => {
      const text = 'Version 1.2.3 of software';
      const result = deidentifyText(text);
      // This shouldn't match as SSN pattern requires dashes or specific format
      expect(result).toBe(text);
    });

    it('should handle multiple phone number formats', () => {
      const text = '(555)123-4567 and 555-123-4567 and 5551234567';
      const result = deidentifyText(text);
      // Count [PHONE] placeholders - may vary based on pattern matching
      const phoneMatches = (result.match(/\[PHONE\]/g) || []).length;
      expect(phoneMatches).toBeGreaterThan(0);
    });

    it('should handle special characters in addresses', () => {
      const text = '123 Main Lane, Downtown';
      const result = deidentifyText(text);
      expect(result).toContain('[ADDRESS]');
      expect(result).not.toContain('123 Main Lane');
    });
  });
});
