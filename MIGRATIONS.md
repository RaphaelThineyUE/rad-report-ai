# Database Migrations

## Overview
This document describes all database migrations for the rad-report-ai project. Migrations should be applied in order (001 → 005).

## Migration Files

### 001_initial_schema.sql
**Status**: ✅ Core tables established
- `users` — user profiles (mirrors auth.users)
- `patients` — patient demographics and cancer information
- `radiology_reports` — breast imaging reports with AI extraction results
- `treatment_records` — treatment history
- `audit_logs` — action audit trail (user_id, action, resource_type, resource_id, created_at)

**Key indexes**: 
- `audit_logs_user_id_created_at` — for efficient audit log queries

### 002_rls_policies.sql
**Status**: ✅ Row Level Security enabled
- Users can only access rows they created (enforced via JWT)
- Anon client uses RLS; admin client bypasses it intentionally
- Policies: select, insert, update, delete scoped to created_by = auth.uid()

### 003_storage_policies.sql
**Status**: ✅ Private Storage bucket configured
- Bucket name: `reports` (configurable via STORAGE_BUCKET env var)
- Policies: users can only upload/read files in their own prefix (`{user_id}/...`)

### 004_organizations.sql
**Status**: ✅ Multi-tenant team support
- `organizations` — team/org container
- `org_members` — membership (with role: owner/admin/member)
- RLS: users can only access orgs they belong to (via org_members)
- Watch for: self-referencing recursion in recursive RLS policies

### 005_breast_imaging_schema.sql
**Status**: ✅ Clinical data extraction fields
- **Study details**: exam_date, modality, contrast, clinical_history, risk_factors, comparison_dates
- **Findings**: comprehensive lesion data (size, BI-RADS, morphology, localization)
- **Systemic findings**: lymph_nodes, skin_nipple_changes, implants, post_surgical_changes
- **Disease extent**: multifocal, multicentric, bilateral_disease, disease_extent
- **Management**: biopsy recommendation, follow-up modality/interval, management, pathology_correlation
- **Full audit**: analysis_json for complete structured output

## Running Migrations

### Local Development
```bash
# Using Supabase CLI (recommended)
supabase migration up

# Or apply via SQL editor in Supabase dashboard
# Copy each file into the SQL editor in order
```

### Production / Staging
1. Create branch in Supabase dashboard
2. Apply migrations in order
3. Test health checks and sample queries
4. Merge branch back to production

## Rollback Strategy

### Automatic Rollback (Not Implemented)
Currently, migrations are forward-only. To rollback:
1. Manual SQL to DROP columns/tables (high risk)
2. OR restore from database backup

### Recommended Approach
- Always test migrations in staging first
- Keep schema changes backward-compatible where possible
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (already in use)

## Migration Validation Checklist

- [ ] All migrations run without errors
- [ ] Tables exist with correct structure: `select tablename from pg_tables where schemaname = 'public'`
- [ ] RLS policies are enforced: `select schemaname, tablename, policyname from pg_policies`
- [ ] Audit logs table exists and is properly indexed
- [ ] Storage bucket exists and policies are applied
- [ ] Health check endpoint returns 200
- [ ] Sample data can be inserted/queried respecting RLS

## Related Issues
- #132: Validate All Database Migrations
