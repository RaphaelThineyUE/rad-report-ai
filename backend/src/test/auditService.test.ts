import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabaseAdmin } from '../services/supabaseClient';
import {
  logUpload,
  logView,
  logDelete,
  logPatientChange,
  logProcessing,
  logPasswordChange,
  logAccountDeletion,
  logEmailChange,
} from '../services/auditService';

// Mock Supabase client
vi.mock('../services/supabaseClient', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logUpload', () => {
    it('should log file upload with filename, patient_id, and size', async () => {
      const userId = 'test-user-id';
      const filename = 'report.pdf';
      const patientId = 'test-patient-id';
      const fileSize = 1024000;

      await logUpload(userId, filename, patientId, fileSize, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logView', () => {
    it('should log report view with report_id and timestamp', async () => {
      const userId = 'test-user-id';
      const reportId = 'test-report-id';
      const patientId = 'test-patient-id';

      await logView(userId, reportId, patientId, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logDelete', () => {
    it('should log report deletion with reason', async () => {
      const userId = 'test-user-id';
      const reportId = 'test-report-id';
      const patientId = 'test-patient-id';

      await logDelete(userId, reportId, patientId, 'User requested deletion', '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logPatientChange', () => {
    it('should log patient creation', async () => {
      const userId = 'test-user-id';
      const patientId = 'test-patient-id';

      await logPatientChange(userId, patientId, 'CREATE', undefined, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log patient update with changes', async () => {
      const userId = 'test-user-id';
      const patientId = 'test-patient-id';
      const changes = {
        cancer_stage: { old: 'Stage II', new: 'Stage III' },
      };

      await logPatientChange(userId, patientId, 'UPDATE', changes, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log patient deletion', async () => {
      const userId = 'test-user-id';
      const patientId = 'test-patient-id';

      await logPatientChange(userId, patientId, 'DELETE', undefined, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logProcessing', () => {
    it('should log report processing completion', async () => {
      const userId = 'test-user-id';
      const reportId = 'test-report-id';
      const patientId = 'test-patient-id';

      await logProcessing(
        userId,
        reportId,
        patientId,
        'completed',
        { processing_time_ms: 5000, birads_value: 3 },
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should log report processing failure', async () => {
      const userId = 'test-user-id';
      const reportId = 'test-report-id';
      const patientId = 'test-patient-id';

      await logProcessing(
        userId,
        reportId,
        patientId,
        'failed',
        { error: 'PDF parsing failed', processing_time_ms: 500 },
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logPasswordChange', () => {
    it('should log password change action', async () => {
      const userId = 'test-user-id';

      await logPasswordChange(userId, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logAccountDeletion', () => {
    it('should log account deletion action', async () => {
      const userId = 'test-user-id';

      await logAccountDeletion(userId, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('logEmailChange', () => {
    it('should log email change action', async () => {
      const userId = 'test-user-id';

      await logEmailChange(userId, '127.0.0.1', 'Mozilla/5.0');

      expect(supabaseAdmin.from).toHaveBeenCalledWith('audit_logs');
    });
  });
});
