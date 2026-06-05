-- RAD-M8-2: Add metadata column to audit_logs table for sensitive action logging
-- Stores PHI-redacted metadata about audit events (filename, patient_id, status, etc.)

ALTER TABLE IF EXISTS audit_logs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Create index on action and created_at for faster queries
CREATE INDEX IF NOT EXISTS audit_logs_action_created_at ON audit_logs (action, created_at DESC);

-- Create index for compliance queries (resource_type and action)
CREATE INDEX IF NOT EXISTS audit_logs_resource_action ON audit_logs (resource_type, action);
