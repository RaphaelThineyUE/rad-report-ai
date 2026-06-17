-- Rollback 002_rls_policies.sql
-- This removes RLS policies and disables row-level security on tables
-- NOTE: Tables remain, only policies are removed

-- Drop all RLS policies for patients
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;

-- Drop all RLS policies for radiology_reports
DROP POLICY IF EXISTS "reports_select" ON radiology_reports;
DROP POLICY IF EXISTS "reports_insert" ON radiology_reports;
DROP POLICY IF EXISTS "reports_update" ON radiology_reports;
DROP POLICY IF EXISTS "reports_delete" ON radiology_reports;

-- Drop all RLS policies for treatment_records
DROP POLICY IF EXISTS "treatments_select" ON treatment_records;
DROP POLICY IF EXISTS "treatments_insert" ON treatment_records;
DROP POLICY IF EXISTS "treatments_update" ON treatment_records;
DROP POLICY IF EXISTS "treatments_delete" ON treatment_records;

-- Drop all RLS policies for audit_logs
DROP POLICY IF EXISTS "audit_select_own" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;

-- Disable RLS on all tables
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
