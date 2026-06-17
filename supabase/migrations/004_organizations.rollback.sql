-- Rollback 004_organizations.sql
-- This restores the original RLS policies and removes organization support
-- IMPORTANT: This must be done before rolling back 002_rls_policies.sql

-- Drop all RLS policies for organizations and organization_members
DROP POLICY IF EXISTS "org_select" ON organizations;
DROP POLICY IF EXISTS "org_update" ON organizations;
DROP POLICY IF EXISTS "org_delete" ON organizations;
DROP POLICY IF EXISTS "org_insert" ON organizations;
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
DROP POLICY IF EXISTS "org_members_update" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;

-- Disable RLS on organization tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- Drop organization tables
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Remove organization_id columns and indexes from existing tables
-- NOTE: This uses DROP COLUMN IF NOT EXISTS which doesn't work, so we drop unconditionally
DROP INDEX IF EXISTS patients_organization_id;
DROP INDEX IF EXISTS reports_organization_id;
DROP INDEX IF EXISTS treatments_organization_id;
DROP INDEX IF EXISTS audit_logs_org_id;

ALTER TABLE patients DROP COLUMN IF EXISTS organization_id;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS organization_id;
ALTER TABLE treatment_records DROP COLUMN IF EXISTS organization_id;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS organization_id;

-- Restore original RLS policies for patients (from 002_rls_policies.sql)
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (auth.uid() = created_by);

-- Restore original RLS policies for radiology_reports (from 002_rls_policies.sql)
CREATE POLICY "reports_select" ON radiology_reports FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "reports_insert" ON radiology_reports FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "reports_update" ON radiology_reports FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "reports_delete" ON radiology_reports FOR DELETE USING (auth.uid() = created_by);

-- Restore original RLS policies for treatment_records (from 002_rls_policies.sql)
CREATE POLICY "treatments_select" ON treatment_records FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "treatments_insert" ON treatment_records FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "treatments_update" ON treatment_records FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "treatments_delete" ON treatment_records FOR DELETE USING (auth.uid() = created_by);

-- Restore original RLS policies for audit_logs (from 002_rls_policies.sql)
CREATE POLICY "audit_select_own" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Re-enable RLS on data tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
