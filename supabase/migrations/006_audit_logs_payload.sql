-- Add payload column to audit_logs for storing request/action details
-- Payload is JSONB and will contain redacted PHI (names, DOBs, emails removed)

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS audit_logs_created_at ON audit_logs (created_at DESC);
