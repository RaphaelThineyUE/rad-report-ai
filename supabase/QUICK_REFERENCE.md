# Migration Quick Reference Guide

## Files Overview

| File | Purpose | Lines |
|------|---------|-------|
| **Migrations** | | |
| 001_initial_schema.sql | Core tables (users, patients, reports, treatments, audit) | 99 |
| 002_rls_policies.sql | Row Level Security (18 policies) | 28 |
| 003_storage_policies.sql | Storage bucket policies (3 policies) | 24 |
| 004_organizations.sql | Multi-tenant org support | 267 |
| 005_breast_imaging_schema.sql | Surgical planning fields | 29 |
| **Rollback Scripts** | | |
| 001_initial_schema.rollback.sql | Drop all tables | 8 |
| 002_rls_policies.rollback.sql | Drop policies, disable RLS | 43 |
| 003_storage_policies.rollback.sql | Drop storage policies | 6 |
| 004_organizations.rollback.sql | Drop orgs, restore 002 policies | 99 |
| 005_breast_imaging_schema.rollback.sql | Drop 17 columns | 23 |
| **Documentation** | | |
| MIGRATION_VALIDATION.md | Detailed validation guide | 400+ |
| MIGRATION_TESTING_GUIDE.md | Step-by-step testing | 600+ |
| SCHEMA_DOCUMENTATION.md | Complete schema specs | 800+ |
| validate_migrations.sql | Automated schema check | 400+ |
| QUICK_REFERENCE.md | This file | N/A |

---

## Quick Start

### Local Development

```bash
# Start local Supabase
supabase start

# Apply all migrations
supabase db push

# Validate schema
supabase sql -f supabase/validate_migrations.sql
```

### Verify Migrations Applied

```bash
# Count tables (should be 7)
psql $DB_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Count policies (should be ~30+)
psql $DB_URL -c "SELECT COUNT(*) FROM pg_policies;"

# Check RLS enabled
psql $DB_URL -c "SELECT tablename FROM pg_class c JOIN pg_policies p ON p.polrelid=c.oid WHERE c.relname IN ('patients','radiology_reports','treatment_records','audit_logs','organizations','organization_members') GROUP BY tablename;"
```

---

## Dependency Graph

```
001 (core tables: users, patients, reports, treatments, audit)
 ├─→ 002 (RLS policies on those tables)
 │    ├─→ 004 (orgs, org_members, updates 002's policies)
 │
 ├─→ 003 (storage policies - independent)
 │
 └─→ 005 (adds 17 columns to reports)
```

---

## Tables Created

| Table | Migration | FK Count | Policies | Purpose |
|-------|-----------|----------|----------|---------|
| users | 001 | 0 | — | User profiles |
| patients | 001 | 1 | 4 (→8 in 004) | Patient records |
| radiology_reports | 001 | 2 | 4 (→8 in 004) | Reports + AI data |
| treatment_records | 001 | 2 | 4 (→8 in 004) | Treatment history |
| audit_logs | 001 | 2 | 2 (→2 in 004) | Audit trail |
| organizations | 004 | 1 | 4 | Team orgs |
| organization_members | 004 | 2 | 4 | Team members |

---

## Key Constraints

### CHECK Constraints
```sql
-- cancer_stage: Stage 0, Stage I, Stage II, Stage III, Stage IV, Unknown
-- er_status, pr_status, her2_status: Positive, Negative, Unknown
-- radiology_reports.status: pending, processing, completed, failed
-- radiology_reports.modality (005): mammography, tomosynthesis, ultrasound, mri, other
-- radiology_reports.contrast (005): with, without, not_applicable
-- treatment_type: Surgery, Chemotherapy, Radiation, Hormone Therapy, Targeted Therapy, Immunotherapy, Other
-- treatment_outcome: Complete Response, Partial Response, Stable Disease, Progressive Disease, Recurrence, Remission, Other
-- organization_members.role: owner, admin, clinician, viewer
```

### UNIQUE Constraints
```sql
-- users.email
-- radiology_reports(patient_id, filename)
-- organization_members(organization_id, user_id)
```

### Foreign Keys
All FKs from data tables point to auth.users
Organization FKs use ON DELETE CASCADE for data cleanup

---

## RLS Access Patterns

After 002 (user-scoped):
- Users see only rows they created

After 004 (org-scoped):
- Users see rows they created OR org members can see

### SELECT Access
```
patients: created_by = auth.uid() OR org member
radiology_reports: created_by = auth.uid() OR org member
treatment_records: created_by = auth.uid() OR org member
audit_logs: user_id = auth.uid() OR org admin
```

### INSERT Access
```
patients: created_by = auth.uid()
radiology_reports: created_by = auth.uid()
treatment_records: created_by = auth.uid()
```

### UPDATE Access
```
patients: created_by = auth.uid() OR org member (clinician+)
radiology_reports: created_by = auth.uid() OR org member (clinician+)
treatment_records: created_by = auth.uid() OR org member (clinician+)
```

### DELETE Access
```
patients: created_by = auth.uid() OR org member (admin+)
radiology_reports: created_by = auth.uid() OR org member (admin+)
treatment_records: created_by = auth.uid() OR org member (admin+)
```

---

## Rollback Sequence

If disaster occurs, rollback in this order (reverse of application):

```bash
# All applied → Rollback to just 004 applied
psql $DB_URL -f 005_breast_imaging_schema.rollback.sql

# All applied → Rollback to just 003 applied
psql $DB_URL -f 004_organizations.rollback.sql

# All applied → Rollback to just 002 applied
psql $DB_URL -f 003_storage_policies.rollback.sql

# All applied → Rollback to just 001 applied
psql $DB_URL -f 002_rls_policies.rollback.sql

# Rollback everything (data loss!)
psql $DB_URL -f 001_initial_schema.rollback.sql
```

---

## Testing Checklist

### Before Deploy
- [ ] All migrations apply without errors locally
- [ ] validate_migrations.sql passes
- [ ] Rollback scripts tested in reverse order
- [ ] Database backed up in staging
- [ ] Team notified of maintenance window

### During Deploy
- [ ] Apply 001 → verify 5 tables exist
- [ ] Apply 002 → verify 18 policies exist
- [ ] Apply 003 → verify storage policies (or skip if no bucket)
- [ ] Apply 004 → verify 7 tables, 30+ policies
- [ ] Apply 005 → verify radiology_reports has 30+ columns

### After Deploy
- [ ] Run validate_migrations.sql
- [ ] Test app login and basic CRUD
- [ ] Check audit logs for errors
- [ ] Monitor error rates for 24 hours

---

## Important Notes

1. **Storage Bucket**: 'reports' bucket must be created manually in Supabase dashboard before applying 003

2. **Auth Schema**: Migrations reference `auth.users` which is Supabase's built-in table

3. **Organization Recursion**: 004's `org_members_select` policy intentionally simple to avoid infinite recursion

4. **Migration Order**: MUST apply in order (001 → 002 → 003 → 004 → 005)
   - Applying 004 before 002 will fail
   - Applying 005 before 001 will fail

5. **Rollback Idempotency**: All rollback scripts use `IF NOT EXISTS` / `IF EXISTS` to be safe

6. **Data Loss**: Rollback of 001, 004, or 005 DELETES data (no recovery possible without backup)

---

## Documentation Map

Need to understand something? Start here:

- **"Which tables exist?"** → SCHEMA_DOCUMENTATION.md (Table Overview section)
- **"What are the migrations?"** → MIGRATION_VALIDATION.md (Summary table)
- **"How do I test locally?"** → MIGRATION_TESTING_GUIDE.md (Phase 1)
- **"What's in the schema?"** → SCHEMA_DOCUMENTATION.md (complete specs)
- **"How do RLS policies work?"** → MIGRATION_VALIDATION.md (RLS Policy Verification section)
- **"What if something breaks?"** → MIGRATION_TESTING_GUIDE.md (Emergency Rollback section)
- **"Does it match CLAUDE.md?"** → SCHEMA_DOCUMENTATION.md (CLAUDE.md Alignment section)
- **"What's the deployment procedure?"** → MIGRATION_TESTING_GUIDE.md (Phase 4)

---

## Files to Read First

1. **This file (QUICK_REFERENCE.md)** - 5 min overview
2. **MIGRATION_VALIDATION.md** - 20 min detailed guide
3. **validate_migrations.sql** - run to verify schema
4. Then: specific guides based on your task (testing, deployment, etc.)

---

## Contact & Support

For issues or questions:
1. Check SCHEMA_DOCUMENTATION.md section "Known Issues & Caveats"
2. Check MIGRATION_TESTING_GUIDE.md section "Troubleshooting"
3. Review MIGRATION_VALIDATION.md for dependency details
4. Check git history: `git log -- supabase/migrations/`

---

Last Updated: 2026-06-17
Commit: 4a91b69
