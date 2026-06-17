# Migration Testing & Deployment Guide

## Quick Start

### Local Development

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase  # macOS
# OR: curl -fsSL https://dl.supabase.com/cli/install/linux.sh | sh  # Linux

# Start local Supabase environment
cd /home/user/rad-report-ai
supabase start

# View migration status
supabase migration list

# Apply all migrations
supabase db push

# Verify schema
supabase sql -f supabase/validate_migrations.sql
```

## Step-by-Step Migration Testing

### Phase 1: Individual Migration Testing

Test each migration in isolation to identify any syntax errors or dependency issues.

#### Test 001_initial_schema.sql

```bash
# Create a temporary test database
supabase db reset

# Manually apply only migration 001
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/001_initial_schema.sql

# Verify tables exist
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\dt public.*"

# Expected output should show:
# - users
# - patients
# - radiology_reports
# - treatment_records
# - audit_logs

# Check column definitions
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.patients"
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.radiology_reports"
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.treatment_records"
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.audit_logs"
```

**Expected Results:**
- [x] 5 tables created
- [x] All FK constraints valid
- [x] UNIQUE constraints on users.email and radiology_reports(patient_id, filename)
- [x] Indexes created: audit_logs_user_id_created_at
- [x] TIMESTAMPTZ columns for audit trail

#### Test 002_rls_policies.sql

```bash
# Apply migration 002 on top of 001
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/002_rls_policies.sql

# Verify RLS is enabled
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT tablename, CASE WHEN pg_table_is_visible(oid) THEN 'enabled' ELSE 'disabled' END FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname IN ('patients', 'radiology_reports', 'treatment_records', 'audit_logs');"

# Count policies
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT tablename, COUNT(*) FROM pg_policies WHERE tablename IN ('patients', 'radiology_reports', 'treatment_records', 'audit_logs') GROUP BY tablename;"

# Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
```

**Expected Results:**
- [x] RLS enabled on 4 tables
- [x] 18 total policies created (4 per table + 2 audit_logs)
- [x] No policy name conflicts
- [x] All policies reference auth.uid()

#### Test 003_storage_policies.sql

```bash
# Note: This migration references the 'reports' storage bucket
# The bucket must be created separately in Supabase dashboard

# Apply migration 003
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/003_storage_policies.sql

# Verify storage policies (if bucket exists)
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT tablename, COUNT(*) FROM pg_policies WHERE tablename = 'objects' GROUP BY tablename;"

# Expected: 3 storage policies (INSERT, SELECT, DELETE)
```

**Expected Results:**
- [x] 3 storage policies created
- [x] Policies reference bucket_id = 'reports'
- [x] User isolation via foldername path matching

#### Test 004_organizations.sql

```bash
# Apply migration 004
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/004_organizations.sql

# Verify new tables
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\dt public.organizations"
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\dt public.organization_members"

# Verify columns added to existing tables
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.patients" | grep organization_id
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.radiology_reports" | grep organization_id
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.treatment_records" | grep organization_id
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.audit_logs" | grep organization_id

# Verify new indexes
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT tablename, indexname FROM pg_indexes WHERE tablename IN ('organizations', 'organization_members', 'patients', 'radiology_reports', 'treatment_records', 'audit_logs') ORDER BY tablename;"

# Verify policies were updated (now 4 per table including org-scoped access)
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT tablename, COUNT(*) FROM pg_policies WHERE tablename IN ('patients', 'radiology_reports', 'treatment_records', 'audit_logs', 'organizations', 'organization_members') GROUP BY tablename;"
```

**Expected Results:**
- [x] 2 new tables created (organizations, organization_members)
- [x] organization_id columns added to 4 existing tables
- [x] Indexes created on all organization_id columns
- [x] Old policies dropped and replaced with org-aware policies
- [x] UNIQUE constraint on (organization_id, user_id)

#### Test 005_breast_imaging_schema.sql

```bash
# Apply migration 005
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/005_breast_imaging_schema.sql

# Verify new columns in radiology_reports
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'radiology_reports' AND column_name IN ('exam_date', 'modality', 'contrast', 'clinical_history', 'lymph_nodes', 'multifocal', 'analysis_json') ORDER BY column_name;"

# Count total columns (should be 30+)
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'radiology_reports';"

# Verify CHECK constraints for modality and contrast
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%modality%' OR constraint_name LIKE '%contrast%';"
```

**Expected Results:**
- [x] 17 new columns added
- [x] CHECK constraints on modality (mammography|tomosynthesis|ultrasound|mri|other)
- [x] CHECK constraints on contrast (with|without|not_applicable)
- [x] JSONB columns for complex data (risk_factors, comparison_dates, lymph_nodes, etc.)
- [x] Total columns in radiology_reports: 30+

### Phase 2: Forward Migration Chain Test

Test all migrations applied in order:

```bash
# Reset to clean state
supabase db reset

# Apply migrations in order using Supabase CLI
supabase db push

# Run comprehensive validation
supabase sql -f supabase/validate_migrations.sql
```

### Phase 3: Rollback Testing

Test each rollback script in reverse order:

```bash
# With all migrations applied, test rollback of 005 first
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/005_breast_imaging_schema.rollback.sql

# Verify columns are removed
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'radiology_reports';"
# Should be ~13 columns (from 001-004, before 005's additions)

# Test rollback of 004
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/004_organizations.rollback.sql

# Verify org tables are gone and org_id columns removed
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\dt public.organizations"  # Should return nothing
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\d public.patients" | grep organization_id  # Should return nothing

# Test rollback of 003
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/003_storage_policies.rollback.sql

# Test rollback of 002
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/002_rls_policies.rollback.sql

# Verify RLS is disabled
psql postgresql://postgres:postgres@localhost:54321/postgres \
  -c "SELECT COUNT(*) FROM pg_policies;" # Should return 0

# Test rollback of 001 (final)
psql postgresql://postgres:postgres@localhost:54321/postgres -f supabase/migrations/001_initial_schema.rollback.sql

# Verify all tables are dropped
psql postgresql://postgres:postgres@localhost:54321/postgres -c "\dt public.*"  # Should return nothing
```

**Expected Results:**
- [x] Each rollback removes the changes from that migration
- [x] Forward → Full Rollback → Forward works correctly (idempotent)
- [x] Data integrity is maintained through rollback/re-apply cycle

### Phase 4: Production Deployment

#### Pre-Deployment Checklist

- [ ] All migrations pass locally
- [ ] All rollback scripts tested locally
- [ ] Validation SQL script runs successfully
- [ ] Production database has backup
- [ ] Deployment window scheduled
- [ ] Team notified of database maintenance

#### Deployment Steps

1. **Create Staging Snapshot**
   ```bash
   # Connect to staging environment
   export SUPABASE_DB_URL="postgresql://user:pass@staging.supabase.co:5432/postgres"

   # Backup current schema
   pg_dump --schema-only $SUPABASE_DB_URL > /tmp/schema_before_migration.sql

   # List current tables/policies
   psql $SUPABASE_DB_URL -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';" > /tmp/tables_before.txt
   psql $SUPABASE_DB_URL -c "SELECT * FROM pg_policies;" > /tmp/policies_before.txt
   ```

2. **Apply Migrations Incrementally**
   ```bash
   # Via Supabase CLI (recommended)
   supabase db push --linked

   # OR manually via dashboard SQL editor:
   # 1. Open Supabase Dashboard → SQL Editor
   # 2. Run each migration file in order (001 → 005)
   # 3. After each: SELECT count(*) FROM pg_policies; (verify policy count)
   ```

3. **Verify Each Migration**
   ```bash
   # After applying 001
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"  # Should be 5

   # After applying 002
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM pg_policies;"  # Should be 18

   # After applying 003
   # Check storage policies (if applicable)

   # After applying 004
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"  # Should be 7

   # After applying 005
   psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'radiology_reports';"  # Should be 30+
   ```

4. **Run Full Validation**
   ```bash
   psql $SUPABASE_DB_URL -f supabase/validate_migrations.sql | tee /tmp/validation_results.txt

   # Review /tmp/validation_results.txt for any failures
   ```

5. **Post-Deployment**
   - [ ] Document migration timestamp and success
   - [ ] Verify application connects successfully
   - [ ] Run smoke tests on key features
   - [ ] Monitor error logs for 24 hours
   - [ ] Archive validation results

#### Emergency Rollback Procedure

If issues occur during or after deployment:

```bash
# Connect to database
export SUPABASE_DB_URL="postgresql://user:pass@prod.supabase.co:5432/postgres"

# Rollback in reverse order (005 → 001)
echo "Starting emergency rollback..."

# 1. Remove breast imaging schema (005)
psql $SUPABASE_DB_URL -f supabase/migrations/005_breast_imaging_schema.rollback.sql || echo "005 rollback failed"

# 2. Remove organizations (004)
psql $SUPABASE_DB_URL -f supabase/migrations/004_organizations.rollback.sql || echo "004 rollback failed"

# 3. Remove storage policies (003)
psql $SUPABASE_DB_URL -f supabase/migrations/003_storage_policies.rollback.sql || echo "003 rollback failed"

# 4. Disable RLS (002)
psql $SUPABASE_DB_URL -f supabase/migrations/002_rls_policies.rollback.sql || echo "002 rollback failed"

# 5. Remove initial schema (001) - ONLY IF ABSOLUTELY NECESSARY
# psql $SUPABASE_DB_URL -f supabase/migrations/001_initial_schema.rollback.sql

echo "Rollback complete. Verify schema:"
psql $SUPABASE_DB_URL -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
```

## Test Data for RLS Validation

Once migrations are deployed, test RLS policies with sample data:

```bash
-- Create test user
-- (Usually done via app auth, but for testing in SQL editor)

-- As user 1: Create a patient
INSERT INTO patients (created_by, full_name, date_of_birth, gender, cancer_type, cancer_stage, diagnosis_date)
VALUES ('user-1-uuid', 'Test Patient 1', '1970-01-01', 'Female', 'Breast', 'Stage II', '2023-01-15');

-- As user 2: Try to view user 1's patient
SELECT * FROM patients WHERE created_by = 'user-1-uuid';
-- Should return empty (RLS prevents cross-user access)

-- As user 1: Create organization
INSERT INTO organizations (owner_id, name, description)
VALUES ('user-1-uuid', 'Test Clinic', 'Test Organization');

-- As user 2: Add user 2 to org as clinician
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('org-uuid', 'user-2-uuid', 'clinician');

-- As user 2: View user 1's patient (now within same org)
SELECT * FROM patients WHERE organization_id = 'org-uuid';
-- Should return patient (org membership grants access)
```

## Automated CI/CD Integration

Add this to your CI/CD pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
# .github/workflows/migrations.yml (Example: GitHub Actions)
name: Database Migrations

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
  push:
    branches: [main, staging]

jobs:
  validate-migrations:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Install Supabase CLI
        run: curl -fsSL https://dl.supabase.com/cli/install/linux.sh | sh

      - name: Apply Migrations
        run: |
          for migration in supabase/migrations/00*.sql; do
            echo "Applying $migration..."
            psql -h localhost -U postgres -d postgres -f "$migration"
          done
        env:
          PGPASSWORD: postgres

      - name: Validate Schema
        run: psql -h localhost -U postgres -d postgres -f supabase/validate_migrations.sql
        env:
          PGPASSWORD: postgres

      - name: Test Rollback
        run: |
          for rollback in $(find supabase/migrations -name "*.rollback.sql" | sort -r); do
            echo "Testing rollback: $rollback..."
            psql -h localhost -U postgres -d postgres -f "$rollback"
          done
        env:
          PGPASSWORD: postgres
```

## Troubleshooting

### Issue: "Cannot execute migration: permission denied on schema public"

**Solution:** Ensure the database user has schema creation privileges:
```sql
ALTER ROLE postgres WITH CREATEDB CREATEROLE CREATEUSER;
GRANT ALL ON SCHEMA public TO postgres;
```

### Issue: "Policy already exists" error

**Solution:** Migration 004 has `DROP POLICY IF EXISTS` statements. If error persists:
```sql
-- Drop all policies manually
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
-- ... etc (see migration file)

-- Then reapply migration 004
```

### Issue: Storage policies fail to apply

**Solution:** Ensure 'reports' bucket exists in Supabase:
1. Open Supabase Dashboard → Storage
2. Create new bucket named 'reports' (private)
3. Then apply migration 003

### Issue: Organization RLS policies cause slow queries

**Solution:** This is expected for complex policies. Ensure indexes exist:
```sql
CREATE INDEX CONCURRENTLY org_members_org_id_user_id ON organization_members(organization_id, user_id);
CREATE INDEX CONCURRENTLY patients_org_id_created_by ON patients(organization_id, created_by);
```

## Documentation Updates

After successful migration:

1. Update `/home/user/rad-report-ai/CLAUDE.md` with any schema changes
2. Archive this guide in `/supabase/MIGRATION_TESTING_GUIDE.md`
3. Update API documentation if schema changes affect endpoints
4. Document any org-scoped features in user guides
5. Add migration notes to release notes

