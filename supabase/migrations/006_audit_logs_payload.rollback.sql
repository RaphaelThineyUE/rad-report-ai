-- Rollback: Remove payload column from audit_logs and related index

DROP INDEX IF EXISTS audit_logs_created_at;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS payload;
