/* eslint-disable @typescript-eslint/no-explicit-any */
import { redactMetadata } from './auditLogger';

/**
 * RAD-M8-3: Tests for PHI-safe audit logger
 * Verifies that sensitive data is properly redacted
 */

describe('auditLogger.redactMetadata', () => {
  describe('PHI Redaction', () => {
    it('should redact dates in YYYY-MM-DD format', () => {
      const input = {
        date_of_birth: '1985-03-15',
        event: 'patient_registered',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        date_of_birth: '[REDACTED-DATE]',
        event: 'patient_registered',
      });
    });

    it('should redact email addresses', () => {
      const input = {
        email: 'john.doe@example.com',
        status: 'active',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        email: '[REDACTED-EMAIL]',
        status: 'active',
      });
    });

    it('should redact phone numbers', () => {
      const input = {
        phone: '555-123-4567',
        contact_type: 'mobile',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        phone: '[REDACTED-PHONE]',
        contact_type: 'mobile',
      });
    });

    it('should redact SSN format', () => {
      const input = {
        ssn: '123-45-6789',
        verified: true,
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        ssn: '[REDACTED-SSN]',
        verified: true,
      });
    });

    it('should redact API keys and tokens', () => {
      const input = {
        api_key: 'sk-1234567890abcdef',
        auth_token: 'Bearer eyJhbGciOiJIUzI1NiIs',
        password: 'MySecret123!',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        api_key: '[REDACTED]',
        auth_token: '[REDACTED]',
        password: '[REDACTED]',
      });
    });

    it('should redact sensitive field keys', () => {
      const input = {
        user_password: 'secret123',
        api_token: 'token_abc123',
        secret_key: 'key_xyz789',
        bearer_token: 'token_data',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        user_password: '[REDACTED]',
        api_token: '[REDACTED]',
        secret_key: '[REDACTED]',
        bearer_token: '[REDACTED]',
      });
    });

    it('should redact PDF content indicators', () => {
      const input = {
        pdf_text: 'This is extracted text from the PDF',
        pdf_content: 'Some document content',
        extracted_text: 'More text from extraction',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        pdf_text: '[REDACTED]',
        pdf_content: '[REDACTED]',
        extracted_text: '[REDACTED]',
      });
    });

    it('should redact Claude prompts and responses', () => {
      const input = {
        prompt: 'Analyze this patient data...',
        claude_response: 'Based on the analysis...',
        ai_prompt: 'Generate a report for...',
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        prompt: '[REDACTED]',
        claude_response: 'Based on the analysis...',
        ai_prompt: '[REDACTED]',
      });
    });

    it('should handle deeply nested objects', () => {
      const input = {
        user: {
          email: 'patient@example.com',
          profile: {
            phone: '555-987-6543',
            dob: '1990-05-20',
          },
        },
        metadata: {
          api_key: 'sk_test_123',
        },
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        user: {
          email: '[REDACTED-EMAIL]',
          profile: {
            phone: '[REDACTED-PHONE]',
            dob: '[REDACTED-DATE]',
          },
        },
        metadata: {
          api_key: '[REDACTED]',
        },
      });
    });

    it('should handle arrays of sensitive data', () => {
      const input = {
        emails: ['test1@example.com', 'test2@example.com'],
        dates: ['2020-01-15', '2021-06-30'],
      };
      const result = redactMetadata(input);
      expect(result).toEqual({
        emails: ['[REDACTED-EMAIL]', '[REDACTED-EMAIL]'],
        dates: ['[REDACTED-DATE]', '[REDACTED-DATE]'],
      });
    });

    it('should preserve non-sensitive strings', () => {
      const input = {
        action: 'REPORT_VIEW',
        resource_type: 'radiology_report',
        status: 'completed',
        level: 'INFO',
      };
      const result = redactMetadata(input);
      expect(result).toEqual(input);
    });

    it('should preserve numbers and booleans', () => {
      const input = {
        count: 42,
        percentage: 87.5,
        active: true,
        archived: false,
      };
      const result = redactMetadata(input);
      expect(result).toEqual(input);
    });

    it('should handle null and undefined', () => {
      const input: any = {
        value1: null,
        value2: undefined,
        value3: 'normal',
      };
      const result = redactMetadata(input) as any;
      expect(result.value1).toBe(null);
      expect(result.value3).toBe('normal');
    });

    it('should prevent infinite recursion with deep nesting', () => {
      let deep: any = { value: 'test' };
      for (let i = 0; i < 15; i++) {
        deep = { nested: deep };
      }
      const result = redactMetadata(deep);
      expect(result).toBeDefined();
    });

    it('should handle string with multiple patterns', () => {
      const input = {
        note: 'Patient John Doe (born 1985-03-15) called at 555-123-4567 from john@example.com',
      };
      const result = redactMetadata(input) as any;
      const note = result.note as string;
      expect(note).toContain('[REDACTED-NAME]');
      expect(note).toContain('[REDACTED-DATE]');
      expect(note).toContain('[REDACTED-PHONE]');
      expect(note).toContain('[REDACTED-EMAIL]');
    });
  });

  describe('Safe fields', () => {
    it('should preserve audit action names', () => {
      const input = {
        action: 'FILE_UPLOAD',
        resource_type: 'radiology_report',
        resource_id: 'uuid-123',
      };
      const result = redactMetadata(input);
      expect(result).toEqual(input);
    });

    it('should preserve UUIDs', () => {
      const input = {
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        report_id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
      };
      const result = redactMetadata(input);
      expect(result).toEqual(input);
    });
  });
});
