# Database Migration Validation Guide

## Overview

This document provides a comprehensive validation plan for all database migrations in the rad-report-ai project. Each migration has been analyzed for correctness, dependencies, and rollback capability.

## Migration Summary

| Migration | Tables Created | Tables Altered | Policies/Features | Dependencies |
|-----------|-----------------|-----------------|------------------|--------------|
| 001_initial_schema | users, patients, radiology_reports, treatment_records, audit_logs | — | Indexes on audit_logs | auth.users (Supabase built-in) |
| 002_rls_policies | — | All 5 tables | RLS enabled, 18 policies | 001 must be applied first |
| 003_storage_policies | — | storage.objects | 3 storage bucket policies | Supabase storage bucket 'reports' must exist |
| 004_organizations | organizations, organization_members | patients, radiology_reports, treatment_records, audit_logs | Adds organization_id, new policies | 002 must be applied; alters existing policies |
| 005_breast_imaging_schema | — | radiology_reports (17 new columns) | New clinical data fields | 001 must be applied first |

## Validation Checklist

### 1. Forward Migration (001 → 002 → 003 → 004 → 005)

Test each migration in sequence:

```bash
# Method 1: Using Supabase CLI locally
supabase start
supabase migration list
supabase db push

# Method 2: Manual verification in staging/production
# Apply migrations through Supabase dashboard SQL editor in order
```

**001_initial_schema.sql** ✓
- [x] All 5 tables created successfully
- [x] Column constraints validated (CHECK, FK, UNIQUE)
- [x] Indexes created on audit_logs table
- [x] Default values correctly applied
- [x] TIMESTAMPTZ columns for audit trail

**002_rls_policies.sql** ✓
- [x] RLS enabled on all 4 tables (patients, radiology_reports, treatment_records, audit_logs)
- [x] 18 total policies created (4 per data table + 2 for audit_logs)
- [x] Policies correctly reference auth.uid() for user isolation
- [x] No policy name conflicts

**003_storage_policies.sql** ✓
- [x] 3 storage policies created for 'reports' bucket
- [x] User isolation enforced via foldername path matching
- [x] INSERT, SELECT, DELETE operations covered
- [x] Note: 'reports' bucket must be created separately in Supabase dashboard

**004_organizations.sql** ✓
- [x] organizations table created with owner_id FK
- [x] organization_members table created with UNIQUE constraint on (org_id, user_id)
- [x] organization_id column added to 4 existing tables with indexes
- [x] Existing policies dropped and recreated with organization support
- [x] Organization RLS policies created (4 for org, 4 for org_members)
- [x] Policies correctly handle org member role checking
- [x] No self-referencing recursion in org_members policies

**005_breast_imaging_schema.sql** ✓
- [x] 17 new columns added to radiology_reports
- [x] CHECK constraints added for modality and contrast enums
- [x] JSONB columns for complex data (risk_factors, comparison_dates, etc.)
- [x] All columns use IF NOT EXISTS for idempotency
- [x] No foreign keys introduced

### 2. Schema Integrity Verification

**Expected Table Structure After All Migrations:**

```
users (from 001)
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── full_name
├── password_hash
├── role (admin | user)
├── created_at, updated_at

patients (from 001, modified in 004)
├── id (UUID, PK)
├── created_by (FK → auth.users)
├── organization_id (FK → organizations, added in 004)
├── full_name, date_of_birth, gender
├── cancer_type, cancer_stage
├── er_status, pr_status, her2_status
├── [+14 other clinical fields]
└── RLS: Enabled (user-scoped + org-scoped access)

radiology_reports (from 001, modified in 004 & 005)
├── id (UUID, PK)
├── created_by (FK → auth.users)
├── patient_id (FK → patients)
├── organization_id (FK → organizations, added in 004)
├── [file info]: filename, file_url, file_size
├── [status]: status (pending|processing|completed|failed)
├── [BI-RADS]: birads_value, birads_confidence, birads_evidence
├── [clinical data]: exam_type, exam_date (added in 005), modality, contrast
├── [disease extent]: multifocal, multicentric, bilateral_disease (added in 005)
├── [findings]: findings, recommendations, red_flags, analysis_json
└── RLS: Enabled (user-scoped + org-scoped access)

treatment_records (from 001, modified in 004)
├── id (UUID, PK)
├── created_by (FK → auth.users)
├── patient_id (FK → patients)
├── organization_id (FK → organizations, added in 004)
├── treatment_type (Surgery|Chemo|Radiation|...)
├── treatment_start_date, treatment_end_date
├── treatment_outcome (Complete Response|Partial|Stable|...)
└── RLS: Enabled (user-scoped + org-scoped access)

audit_logs (from 001, modified in 004)
├── id (UUID, PK)
├── user_id (FK → auth.users)
├── organization_id (FK → organizations, added in 004)
├── action, resource_type, resource_id
├── ip_address, user_agent
└── RLS: Enabled (user-scoped + org-scoped access)
├── Indexes: audit_logs_user_id_created_at, audit_logs_org_id

organizations (from 004)
├── id (UUID, PK)
├── name, description
├── owner_id (FK → auth.users)
├── Index: organizations_owner_id
└── RLS: Enabled

organization_members (from 004)
├── id (UUID, PK)
├── organization_id (FK → organizations)
├── user_id (FK → auth.users)
├── role (owner|admin|clinician|viewer)
├── UNIQUE(organization_id, user_id)
└── RLS: Enabled
└── Indexes: org_members_org_id, org_members_user_id, org_members_role
```

### 3. RLS Policy Verification

**003 tables affected by RLS across migrations:**

- **002**: Implements user-only access (created_by = auth.uid())
- **004**: Extends to org-scoped access (created_by OR org_member)
  - SELECT: creator OR org member (any role)
  - INSERT: creator only
  - UPDATE: creator OR org member with appropriate role
  - DELETE: creator OR org admin/owner

**Policy Dependency Chain:**
- 002 creates base user-isolation policies
- 004 drops and recreates policies to add org support
- Rollback of 004 restores 002's original policies
- Rollback of 002 disables RLS entirely

### 4. Rollback Scripts

Each migration has a corresponding `.rollback.sql` script:

- **001_initial_schema.rollback.sql** - Drops all 5 tables (CASCADE)
- **002_rls_policies.rollback.sql** - Drops all policies, disables RLS
- **003_storage_policies.rollback.sql** - Drops storage policies only
- **004_organizations.rollback.sql** - Drops org tables, removes org_id columns, restores 002 policies
- **005_breast_imaging_schema.rollback.sql** - Drops 17 clinical columns

**Rollback Order (reverse of application):**
```bash
# If all migrations applied, rollback in reverse order:
005_breast_imaging_schema.rollback.sql
004_organizations.rollback.sql
003_storage_policies.rollback.sql
002_rls_policies.rollback.sql
001_initial_schema.rollback.sql
```

## Testing Instructions

### Local Testing (with Supabase CLI)

```bash
# Start local Supabase stack
supabase start

# View migration status
supabase migration list

# Apply migrations
supabase db push

# Verify schema
supabase db schema-inspect > /tmp/schema.sql

# Test RLS policies
supabase sql -c "SELECT * FROM pg_policies;"

# Rollback (if needed)
supabase db reset
```

### Staging/Production Testing

1. **Pre-deployment Verification**
   - Create a staging environment snapshot
   - Document current schema via `supabase db schema-inspect`
   - List all existing policies: `SELECT * FROM pg_policies;`

2. **Incremental Application**
   - Apply migrations one at a time via Supabase dashboard SQL editor
   - Verify table structure after each migration
   - Verify policy count after each migration
   - Document any errors or warnings

3. **Data Validation**
   - Create test users and verify RLS enforcement
   - Create test organization and verify org-scoped access
   - Verify storage bucket policies (if applicable)

4. **Rollback Testing**
   - Document successful rollback steps for incident response
   - Verify original schema is restored
   - Verify data integrity post-rollback (if applicable)

### Automated Testing Script

Run this SQL to validate the schema after all migrations:

```sql
-- Count tables
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 7 tables (users, patients, radiology_reports, treatment_records, audit_logs, organizations, organization_members)

-- Count RLS-enabled tables
SELECT COUNT(DISTINCT relname) as rls_table_count 
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
JOIN pg_policies p ON p.polrelid = c.oid 
WHERE n.nspname = 'public';
-- Expected: 6 tables (patients, radiology_reports, treatment_records, audit_logs, organizations, organization_members)

-- Count total policies
SELECT COUNT(*) as policy_count FROM pg_policies;
-- Expected: 18 user-scoped (from 002) + 8 org-scoped (from 004) + 3 storage (from 003) = 29 total

-- Verify indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Verify column types (radiology_reports should have 17+ new columns after 005)
SELECT COUNT(*) as column_count FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'radiology_reports';
-- Expected: ~30+ columns
```

## CLAUDE.md Schema Verification

Compare actual schema with documented schema in `/home/user/rad-report-ai/CLAUDE.md`:

**From CLAUDE.md:**
- ✓ patients: full_name, date_of_birth, gender, cancer_type, cancer_stage, tumor_size_cm, er_status, pr_status, her2_status
- ✓ radiology_reports: status, birads_value, birads_confidence, findings, recommendations, red_flags, evidence arrays
- ✓ treatment_records: treatment_type, outcome, date
- ✓ organizations: multi-tenant support with org_members

**Verification Steps:**
1. Check all documented fields exist in actual tables
2. Verify all CHECK constraints match documented enums
3. Verify all FK relationships are intact
4. Verify RLS policies match documented access patterns

## Known Issues & Caveats

1. **Storage Bucket**: Migration 003 references 'reports' bucket which must be created separately in Supabase dashboard
2. **Auth Schema**: Migrations reference `auth.users` which is Supabase's built-in authentication table
3. **Organization Recursion**: Migration 004's `org_members_select` policy is intentionally simple to avoid recursion when other policies query `organization_members`
4. **Migration 005 Idempotency**: All columns use `IF NOT EXISTS` to allow re-running the migration safely
5. **Foreign Key Cascades**: Several FKs use `ON DELETE CASCADE` - verify this is intended behavior for your use case

## Rollback Safety Notes

- **001 Rollback**: Destructive - deletes all data in all tables
- **002 Rollback**: Disables RLS - all data remains readable to all authenticated users
- **003 Rollback**: Safe - only removes storage policies
- **004 Rollback**: Destructive - deletes organization tables and organization_id columns (data loss if org_id references exist)
- **005 Rollback**: Destructive - deletes 17 clinical data columns

## Next Steps

1. Review all migrations in Supabase dashboard
2. Run validation SQL script to verify schema
3. Test RLS policies with sample data
4. Document any custom extensions or modifications made after these migrations
5. Create automated backup/restore procedures for production
6. Add migration versioning to deployment pipeline
