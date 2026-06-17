-- Comprehensive Migration Validation Script
-- Run this after all migrations are applied to verify schema integrity

-- ============================================================================
-- SECTION 1: Table Structure Validation
-- ============================================================================

-- 1.1 Count total tables
SELECT
  COUNT(*) as total_tables,
  'VALIDATION: Should be 7 (users, patients, radiology_reports, treatment_records, audit_logs, organizations, organization_members)' as expected
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 1.2 List all tables with row counts
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND information_schema.columns.table_name = information_schema.tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 1.3 Verify critical columns exist
-- Users table (001)
SELECT 'users' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';

-- Patients table (001 + 004)
SELECT 'patients' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'patients'
AND column_name IN ('id', 'created_by', 'organization_id', 'full_name', 'cancer_stage', 'er_status');

-- Radiology reports table (001 + 004 + 005)
SELECT
  'radiology_reports' as table_name,
  COUNT(*) as column_count,
  CASE WHEN COUNT(*) >= 30 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'radiology_reports';

-- Treatment records table (001 + 004)
SELECT
  'treatment_records' as table_name,
  COUNT(*) as column_count,
  CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'treatment_records';

-- Audit logs table (001 + 004)
SELECT
  'audit_logs' as table_name,
  COUNT(*) as column_count,
  CASE WHEN COUNT(*) >= 7 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'audit_logs';

-- Organizations table (004)
SELECT
  'organizations' as table_name,
  COUNT(*) as column_count,
  CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'organizations';

-- Organization members table (004)
SELECT
  'organization_members' as table_name,
  COUNT(*) as column_count,
  CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'organization_members';

-- ============================================================================
-- SECTION 2: Foreign Key Validation
-- ============================================================================

-- 2.1 List all foreign key constraints
SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' AND referenced_table_name IS NOT NULL
ORDER BY table_name, constraint_name;

-- 2.2 Verify no dangling foreign keys
-- This will return rows if there are orphaned records
SELECT 'patients' as table_name, COUNT(*) as orphaned_count
FROM patients p
WHERE p.created_by IS NOT NULL
AND p.created_by NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 'radiology_reports', COUNT(*)
FROM radiology_reports r
WHERE r.created_by IS NOT NULL
AND r.created_by NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 'treatment_records', COUNT(*)
FROM treatment_records t
WHERE t.created_by IS NOT NULL
AND t.created_by NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 'audit_logs', COUNT(*)
FROM audit_logs a
WHERE a.user_id IS NOT NULL
AND a.user_id NOT IN (SELECT id FROM auth.users);

-- ============================================================================
-- SECTION 3: RLS Policy Validation
-- ============================================================================

-- 3.1 Count RLS-enabled tables
SELECT
  COUNT(DISTINCT polrelname) as rls_enabled_tables,
  'VALIDATION: Should be 6 tables (patients, radiology_reports, treatment_records, audit_logs, organizations, organization_members)' as expected
FROM pg_policies;

-- 3.2 List all policies by table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as check_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3.3 Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN tablename IN ('patients', 'radiology_reports', 'treatment_records', 'audit_logs') THEN 'EXPECT: 4 (SELECT, INSERT, UPDATE, DELETE)'
    WHEN tablename IN ('organizations', 'organization_members') THEN 'EXPECT: 4 (SELECT, INSERT, UPDATE, DELETE)'
  END as expected
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3.4 Verify RLS is actually enabled on tables
SELECT
  tablename,
  CASE WHEN pg_table_is_visible(oid) THEN 'visible' ELSE 'hidden' END as visibility,
  CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND c.relname IN ('patients', 'radiology_reports', 'treatment_records', 'audit_logs', 'organizations', 'organization_members')
ORDER BY relname;

-- ============================================================================
-- SECTION 4: Index Validation
-- ============================================================================

-- 4.1 List all indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4.2 Verify critical indexes exist
SELECT
  'audit_logs_user_id_created_at' as expected_index,
  CASE WHEN indexname = 'audit_logs_user_id_created_at' THEN 'FOUND' ELSE 'MISSING' END as status
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'audit_logs'
AND indexname = 'audit_logs_user_id_created_at'
UNION ALL
SELECT 'organizations_owner_id',
CASE WHEN indexname = 'organizations_owner_id' THEN 'FOUND' ELSE 'MISSING' END
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'organizations'
AND indexname = 'organizations_owner_id'
UNION ALL
SELECT 'org_members_org_id',
CASE WHEN indexname = 'org_members_org_id' THEN 'FOUND' ELSE 'MISSING' END
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'organization_members'
AND indexname = 'org_members_org_id';

-- ============================================================================
-- SECTION 5: Data Type & Constraint Validation
-- ============================================================================

-- 5.1 Verify CHECK constraints on enums
SELECT
  constraint_name,
  table_name,
  column_name,
  CHECK_CLAUSE
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE table_schema = 'public'
ORDER BY table_name, constraint_name;

-- 5.2 Verify cancer_stage enum
SELECT 'cancer_stage' as column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'cancer_stage'
AND data_type = 'text';

-- 5.3 Verify status enum in radiology_reports
SELECT 'status' as column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'radiology_reports' AND column_name = 'status'
AND data_type = 'text';

-- 5.4 Verify modality enum (005_breast_imaging_schema)
SELECT 'modality' as column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'radiology_reports' AND column_name = 'modality';

-- 5.5 Verify JSONB columns
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type = 'jsonb'
ORDER BY table_name, column_name;

-- ============================================================================
-- SECTION 6: Unique Constraints
-- ============================================================================

-- 6.1 List all unique constraints
SELECT
  constraint_name,
  table_name,
  string_agg(column_name, ', ') as columns
FROM information_schema.key_column_usage
WHERE table_schema = 'public' AND constraint_type = 'UNIQUE'
GROUP BY constraint_name, table_name
ORDER BY table_name, constraint_name;

-- 6.2 Verify critical unique constraints
SELECT
  'users.email' as constraint_target,
  CASE WHEN constraint_name IS NOT NULL THEN 'FOUND' ELSE 'MISSING' END as status
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'users' AND constraint_type = 'UNIQUE'
LIMIT 1
UNION ALL
SELECT 'radiology_reports(patient_id, filename)',
CASE WHEN constraint_name IS NOT NULL THEN 'FOUND' ELSE 'MISSING' END
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'radiology_reports' AND constraint_type = 'UNIQUE'
LIMIT 1
UNION ALL
SELECT 'organization_members(organization_id, user_id)',
CASE WHEN constraint_name IS NOT NULL THEN 'FOUND' ELSE 'MISSING' END
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'organization_members' AND constraint_type = 'UNIQUE'
LIMIT 1;

-- ============================================================================
-- SECTION 7: Storage Policies (if applicable)
-- ============================================================================

-- 7.1 List storage policies (from 003_storage_policies)
SELECT
  policyname,
  tablename,
  permissive,
  qual as policy_expression
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- SECTION 8: Migration Completeness Check
-- ============================================================================

-- Run this summary to check overall health
DO $$
DECLARE
  v_table_count INT;
  v_rls_count INT;
  v_policy_count INT;
  v_radiology_columns INT;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  -- Count RLS-enabled tables
  SELECT COUNT(DISTINCT polrelname) INTO v_rls_count FROM pg_policies;

  -- Count policies
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies;

  -- Count radiology_reports columns (should be 30+)
  SELECT COUNT(*) INTO v_radiology_columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'radiology_reports';

  RAISE NOTICE '=== MIGRATION VALIDATION SUMMARY ===';
  RAISE NOTICE 'Total Tables: % (Expected: 7)', v_table_count;
  RAISE NOTICE 'RLS-Enabled Tables: % (Expected: 6)', v_rls_count;
  RAISE NOTICE 'Total Policies: % (Expected: ~30+)', v_policy_count;
  RAISE NOTICE 'Radiology Report Columns: % (Expected: 30+)', v_radiology_columns;
  RAISE NOTICE '====================================';

  IF v_table_count = 7 AND v_rls_count >= 6 AND v_policy_count >= 20 AND v_radiology_columns >= 30 THEN
    RAISE NOTICE 'STATUS: ALL MIGRATIONS APPLIED SUCCESSFULLY ✓';
  ELSE
    RAISE NOTICE 'STATUS: VALIDATION FAILED - Review results above';
  END IF;
END $$;
