-- RAD-M8-1: Audit logs table enhancement
-- Add metadata column to audit_logs table for additional context

-- Add metadata column if it doesn't exist
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on metadata if it doesn't exist (for JSONB queries)
CREATE INDEX IF NOT EXISTS audit_logs_metadata_idx ON audit_logs USING GIN (metadata);

-- Ensure RLS is enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to replace them
DROP POLICY IF EXISTS "audit_select_own" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert_service" ON audit_logs;

-- Policy 1: Admins can read all logs
CREATE POLICY "audit_select_admin" ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 2: Service role can insert logs (used by backend)
CREATE POLICY "audit_insert_service" ON audit_logs
FOR INSERT
WITH CHECK (true);

-- Policy 3: Regular users can only read their own logs
CREATE POLICY "audit_select_own" ON audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_logs_resource_type_idx ON audit_logs (resource_type);
