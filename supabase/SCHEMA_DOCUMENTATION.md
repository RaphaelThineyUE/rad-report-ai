# Database Schema Documentation

This document provides complete schema details for the rad-report-ai database, verifying alignment with CLAUDE.md specifications.

## Table Overview

### 1. users (001_initial_schema.sql)

**Purpose**: User profiles that mirror Supabase auth.users table

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| email | TEXT | UNIQUE, NOT NULL | User's email address |
| full_name | TEXT | | User's display name |
| password_hash | TEXT | NOT NULL | Bcrypt hash (managed by Supabase) |
| role | TEXT | CHECK (admin \| user), DEFAULT 'user' | User role for authorization |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Indexes**: None (email has unique constraint)

**RLS**: Not enabled (application-level auth)

**Status**: ✓ MATCHES CLAUDE.md ("mirrors auth.users")

---

### 2. patients (001_initial_schema.sql + 004_organizations.sql)

**Purpose**: Patient medical records with cancer staging and biomarker status

**Core Columns (001)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| created_by | UUID | FK → auth.users(id) | User who created record |
| full_name | TEXT | NOT NULL | Patient name (de-identified before Claude) |
| date_of_birth | DATE | NOT NULL | Patient DOB (de-identified before Claude) |
| gender | TEXT | CHECK (Male \| Female \| Other) | Patient gender |
| ethnicity | TEXT | | Ethnicity information |
| diagnosis_date | DATE | NOT NULL | Cancer diagnosis date |
| cancer_type | TEXT | NOT NULL | Type of cancer (e.g., Breast) |
| cancer_stage | TEXT | CHECK (Stage 0 \| Stage I \| Stage II \| Stage III \| Stage IV \| Unknown) | TNM stage classification |
| tumor_size_cm | NUMERIC | | Largest tumor dimension in cm |
| lymph_node_positive | BOOLEAN | | Lymph node involvement |
| er_status | TEXT | CHECK (Positive \| Negative \| Unknown), DEFAULT 'Unknown' | Estrogen receptor status |
| pr_status | TEXT | CHECK (Positive \| Negative \| Unknown), DEFAULT 'Unknown' | Progesterone receptor status |
| her2_status | TEXT | CHECK (Positive \| Negative \| Unknown), DEFAULT 'Unknown' | HER2 receptor status |
| menopausal_status | TEXT | | Menopausal status at diagnosis |
| initial_treatment_plan | TEXT | | Initial treatment recommendations |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Columns Added (004)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| organization_id | UUID | FK → organizations(id), ON DELETE CASCADE | Organization this patient belongs to |

**Indexes**:
- patients_organization_id (004)

**RLS Policy** (004):
```sql
-- SELECT: created_by OR org member
-- INSERT: created_by only
-- UPDATE: created_by OR org member (clinician+)
-- DELETE: created_by OR org member (admin+)
```

**Status**: ✓ MATCHES CLAUDE.md ("cancer_stage (Stage 0–IV/Unknown), tumor_size_cm, er_status/pr_status/her2_status (Positive/Negative/Unknown)")

---

### 3. radiology_reports (001 + 004 + 005)

**Purpose**: Radiology report data with AI-extracted clinical findings and BI-RADS classification

**Core Columns (001)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| created_by | UUID | FK → auth.users(id) | User who uploaded report |
| patient_id | UUID | FK → patients(id), NOT NULL | Associated patient |
| filename | TEXT | NOT NULL | Original PDF filename |
| file_url | TEXT | | Supabase Storage URL |
| file_size | INTEGER | | Size in bytes |
| status | TEXT | CHECK (pending \| processing \| completed \| failed), DEFAULT 'pending' | AI processing status |
| summary | TEXT | | AI-generated summary |
| birads_value | INTEGER | CHECK (0-6) | BI-RADS classification (0=incomplete, 1=normal, 2=benign, 3=probably benign, 4=suspicious, 5=malignant, 6=known malignancy) |
| birads_confidence | TEXT | CHECK (low \| medium \| high) | Confidence level of BI-RADS classification |
| birads_evidence | JSONB | | Evidence quotes supporting BI-RADS classification |
| breast_density_value | TEXT | | Density classification (a-d) |
| breast_density_evidence | JSONB | | Evidence for density classification |
| exam_type | TEXT | | Type of exam (mammography, ultrasound, MRI, etc.) |
| exam_laterality | TEXT | | Laterality (left, right, bilateral) |
| exam_evidence | JSONB | | Evidence for exam type/laterality |
| comparison_prior_exam_date | TEXT | | Prior exam comparison date |
| comparison_evidence | JSONB | | Evidence for comparison |
| findings | JSONB | | AI-extracted clinical findings |
| recommendations | JSONB | | AI-generated recommendations |
| red_flags | JSONB | | Flagged high-risk findings |
| processing_time_ms | INTEGER | | Time spent on AI processing |
| raw_text | TEXT | | OCR'd text from PDF |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Constraints**:
- UNIQUE (patient_id, filename) — prevent duplicate uploads for same patient

**Columns Added (004)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| organization_id | UUID | FK → organizations(id), ON DELETE CASCADE | Organization this report belongs to |

**Columns Added (005)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| exam_date | DATE | | Date of examination |
| modality | TEXT | CHECK (mammography \| tomosynthesis \| ultrasound \| mri \| other) | Imaging modality |
| contrast | TEXT | CHECK (with \| without \| not_applicable) | Contrast administration |
| clinical_history | TEXT | | Referring clinical history |
| risk_factors | JSONB | DEFAULT '[]' | Extracted risk factors |
| comparison_dates | JSONB | DEFAULT '[]' | Array of prior comparison dates |
| lymph_nodes | JSONB | DEFAULT '[]' | Lymph node findings |
| skin_nipple_changes | JSONB | DEFAULT '[]' | Skin/nipple abnormalities |
| implants | JSONB | | Implant information |
| post_surgical_changes | JSONB | DEFAULT '[]' | Post-surgical changes |
| multifocal | BOOLEAN | | Disease multifocal (surgical planning) |
| multicentric | BOOLEAN | | Disease multicentric (surgical planning) |
| bilateral_disease | BOOLEAN | | Bilateral disease present |
| disease_extent | TEXT | | Disease extent summary |
| management | JSONB | | Management recommendations |
| pathology_correlation | TEXT | | Pathology correlation notes |
| analysis_json | JSONB | | Full structured analysis |

**Indexes**:
- radiology_reports(patient_id, filename) - UNIQUE
- reports_organization_id (004)

**RLS Policy** (004):
```sql
-- SELECT: created_by OR org member
-- INSERT: created_by only
-- UPDATE: created_by OR org member (clinician+)
-- DELETE: created_by OR org member (admin+)
```

**Status**: ✓ MATCHES CLAUDE.md ("status (pending/processing/completed/failed), birads_value (0–6), birads_confidence, findings, recommendations, red_flags — each AI-derived field pairs with an *_evidence array")

---

### 4. treatment_records (001 + 004)

**Purpose**: Treatment history with outcome tracking

**Core Columns (001)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| created_by | UUID | FK → auth.users(id) | User who created record |
| patient_id | UUID | FK → patients(id) | Associated patient |
| treatment_type | TEXT | CHECK (Surgery \| Chemotherapy \| Radiation \| Hormone Therapy \| Targeted Therapy \| Immunotherapy \| Other) | Type of treatment |
| treatment_start_date | DATE | NOT NULL | Treatment start date |
| treatment_end_date | DATE | | Treatment end date |
| medication_details | TEXT | | Specific medications/protocols |
| treatment_outcome | TEXT | CHECK (Complete Response \| Partial Response \| Stable Disease \| Progressive Disease \| Recurrence \| Remission \| Other) | Treatment outcome |
| side_effects | TEXT | | Documented side effects |
| follow_up_date | DATE | | Next follow-up date |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Columns Added (004)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| organization_id | UUID | FK → organizations(id), ON DELETE CASCADE | Organization this treatment belongs to |

**Indexes**:
- treatments_organization_id (004)

**RLS Policy** (004):
```sql
-- SELECT: created_by OR org member
-- INSERT: created_by only
-- UPDATE: created_by OR org member (clinician+)
-- DELETE: created_by OR org member (admin+)
```

**Status**: ✓ MATCHES CLAUDE.md ("treatment_type (Surgery/Chemotherapy/Radiation/Hormone Therapy/...) and outcome/date")

---

### 5. audit_logs (001 + 004)

**Purpose**: Audit trail for compliance and security monitoring

**Core Columns (001)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| user_id | UUID | FK → auth.users(id) | User who performed action |
| action | TEXT | NOT NULL | Action type (create, read, update, delete, login, logout) |
| resource_type | TEXT | | Type of resource (patient, report, treatment, etc.) |
| resource_id | UUID | | ID of resource being acted upon |
| ip_address | TEXT | | Client IP address |
| user_agent | TEXT | | Client user agent |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |

**Columns Added (004)**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| organization_id | UUID | FK → organizations(id), ON DELETE CASCADE | Organization context for audit |

**Indexes**:
- audit_logs_user_id_created_at (001)
- audit_logs_org_id (004)

**RLS Policy** (004):
```sql
-- SELECT: user_id = self OR org member (admin+)
-- INSERT: user_id = self
```

**Status**: ✓ MATCHES CLAUDE.md ("Sensitive actions write to audit_logs asynchronously (fire-and-forget). Actions include: login/logout, view patient, create/update/delete patient, upload report, request signed PDF URL, delete report, all AI analysis calls")

---

### 6. organizations (004_organizations.sql)

**Purpose**: Multi-tenant organization support for team collaboration

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| name | TEXT | NOT NULL | Organization name |
| description | TEXT | | Organization description |
| owner_id | UUID | NOT NULL, FK → auth.users(id), ON DELETE CASCADE | Organization owner |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Indexes**:
- organizations_owner_id

**RLS Policies**:
```sql
-- SELECT: owner OR org member
-- INSERT: owner only
-- UPDATE: owner only
-- DELETE: owner only
```

**Status**: ✓ MATCHES CLAUDE.md ("organizations + org_members tables for multi-tenant team support")

---

### 7. organization_members (004_organizations.sql)

**Purpose**: Team membership within organizations with role-based access control

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| organization_id | UUID | NOT NULL, FK → organizations(id), ON DELETE CASCADE | Organization |
| user_id | UUID | NOT NULL, FK → auth.users(id), ON DELETE CASCADE | Team member |
| role | TEXT | NOT NULL, CHECK (owner \| admin \| clinician \| viewer) | Member role |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record last update timestamp |

**Constraints**:
- UNIQUE (organization_id, user_id) — one role per user per org

**Indexes**:
- org_members_org_id
- org_members_user_id
- org_members_role

**RLS Policies**:
```sql
-- SELECT: user_id = self (intentionally simple to avoid recursion)
-- INSERT: org admin/owner only
-- UPDATE: org admin/owner only
-- DELETE: org owner only
```

**Status**: ✓ MATCHES CLAUDE.md ("watch for self-referencing recursion, see commit history")

---

## RLS Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| patients | created_by OR org_member | created_by | created_by OR org_clinician+ | created_by OR org_admin+ | (002 base, 004 enhanced) |
| radiology_reports | created_by OR org_member | created_by | created_by OR org_clinician+ | created_by OR org_admin+ | (002 base, 004 enhanced) |
| treatment_records | created_by OR org_member | created_by | created_by OR org_clinician+ | created_by OR org_admin+ | (002 base, 004 enhanced) |
| audit_logs | user_id OR org_admin+ | user_id | — | — | (002 base, 004 enhanced) |
| organizations | owner OR org_member | owner | owner | owner | (004) |
| organization_members | user_id (self) | org_admin/owner | org_admin/owner | org_owner | (004, intentionally simple) |

---

## Storage Policies (003_storage_policies.sql)

**Bucket**: reports (private)

**Policies**:

```sql
-- storage_insert
FOR INSERT
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text

-- storage_select
FOR SELECT
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text

-- storage_delete
FOR DELETE
  bucket_id = 'reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
```

**Access Model**: Users can only access files in their own UUID prefix (e.g., `/user-uuid/filename.pdf`)

**Status**: ✓ MATCHES CLAUDE.md ("private `reports` Storage bucket; users can upload only to their own path prefix")

---

## CHECK Constraints

### patient.cancer_stage
```sql
CHECK (cancer_stage IN ('Stage 0','Stage I','Stage II','Stage III','Stage IV','Unknown'))
```
Status: ✓ Matches CLAUDE.md ("Stage 0–IV/Unknown")

### patient.er_status, pr_status, her2_status
```sql
CHECK (status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown'
```
Status: ✓ Matches CLAUDE.md ("(Positive/Negative/Unknown)")

### radiology_reports.status
```sql
CHECK (status IN ('pending','processing','completed','failed')) DEFAULT 'pending'
```
Status: ✓ Matches CLAUDE.md ("(pending/processing/completed/failed)")

### radiology_reports.birads_confidence
```sql
CHECK (birads_confidence IN ('low','medium','high'))
```
Status: ✓ Referenced in CLAUDE.md

### radiology_reports.modality (005)
```sql
CHECK (modality IN ('mammography','tomosynthesis','ultrasound','mri','other'))
```
Status: ✓ Clinical terminology

### radiology_reports.contrast (005)
```sql
CHECK (contrast IN ('with','without','not_applicable'))
```
Status: ✓ Clinical standard

### treatment_records.treatment_type
```sql
CHECK (treatment_type IN (
  'Surgery','Chemotherapy','Radiation',
  'Hormone Therapy','Targeted Therapy','Immunotherapy','Other'
))
```
Status: ✓ Matches CLAUDE.md ("Surgery/Chemotherapy/Radiation/Hormone Therapy/...")

### treatment_records.treatment_outcome
```sql
CHECK (treatment_outcome IN (
  'Complete Response','Partial Response','Stable Disease',
  'Progressive Disease','Recurrence','Remission','Other'
))
```
Status: ✓ Clinical RECIST criteria

### organization_members.role
```sql
CHECK (role IN ('owner', 'admin', 'clinician', 'viewer'))
```
Status: ✓ Supports RBAC for team collaboration

---

## Foreign Key Relationships

```
auth.users (Supabase built-in)
  ├── users.id
  ├── patients.created_by ──┘
  ├── radiology_reports.created_by ──┘
  ├── treatment_records.created_by ──┘
  ├── audit_logs.user_id ──┘
  ├── organizations.owner_id ──┘
  └── organization_members.user_id ──┘

users (application table)
  ├── users.id

patients
  ├── patients.created_by → auth.users(id)
  ├── patients.organization_id → organizations(id) ON DELETE CASCADE
  └── radiology_reports.patient_id ──┘

radiology_reports
  ├── radiology_reports.created_by → auth.users(id)
  ├── radiology_reports.patient_id → patients(id)
  └── radiology_reports.organization_id → organizations(id) ON DELETE CASCADE

treatment_records
  ├── treatment_records.created_by → auth.users(id)
  ├── treatment_records.patient_id → patients(id)
  └── treatment_records.organization_id → organizations(id) ON DELETE CASCADE

organizations
  ├── organizations.owner_id → auth.users(id) ON DELETE CASCADE
  ├── organizations.id
  ├── organization_members.organization_id ──┘
  ├── patients.organization_id ──┘
  ├── radiology_reports.organization_id ──┘
  ├── treatment_records.organization_id ──┘
  └── audit_logs.organization_id ──┘

organization_members
  ├── organization_members.organization_id → organizations(id) ON DELETE CASCADE
  └── organization_members.user_id → auth.users(id) ON DELETE CASCADE

audit_logs
  ├── audit_logs.user_id → auth.users(id)
  └── audit_logs.organization_id → organizations(id) ON DELETE CASCADE
```

---

## CLAUDE.md Alignment Summary

All schema elements documented in CLAUDE.md are implemented and present:

| CLAUDE.md Reference | Implementation | Status |
|---------------------|-----------------|--------|
| Core tables (001) | ✓ All 5 created | PASS |
| RLS policies (002) | ✓ 18 policies | PASS |
| Storage bucket policies (003) | ✓ 3 policies | PASS |
| Organizations (004) | ✓ 2 new tables, org_id columns | PASS |
| Patient fields | ✓ All present (full_name, DOB, cancer_stage, ER/PR/HER2) | PASS |
| Report fields | ✓ All present (status, BI-RADS, findings, evidence arrays) | PASS |
| Treatment fields | ✓ All present (treatment_type, outcome, dates) | PASS |
| Audit logging | ✓ Full audit_logs table with org support | PASS |
| Multi-tenant | ✓ Organizations + org_members | PASS |
| Recursion handling | ✓ org_members_select kept simple | PASS |

---

## Migration Order Verification

Migrations must be applied in this order to resolve dependencies:

1. **001_initial_schema** ← Creates core tables
2. **002_rls_policies** ← Depends on tables from 001
3. **003_storage_policies** ← Depends on Supabase storage (independent)
4. **004_organizations** ← Depends on 002's RLS, alters tables from 001
5. **005_breast_imaging_schema** ← Depends on radiology_reports from 001

**Applying out of order will fail.** For example:
- Applying 004 before 002 fails (tables need RLS before org policies)
- Applying 005 before 001 fails (radiology_reports doesn't exist)

---

## Notes for Developers

1. **De-identification**: Before sending to Claude, clean identifiers in `backend/src/services/deidentify.ts`
2. **Evidence validation**: Quotes from AI are verified against raw text to prevent hallucinations
3. **Async audit logging**: Fire-and-forget pattern prevents audit writes from blocking requests
4. **Organization cascades**: ON DELETE CASCADE on org_id means deleting org deletes all associated data
5. **RLS recursion**: org_members_select policy intentionally simple to avoid recursion loops
6. **Storage path**: Files stored under `{bucket}/​{user-uuid}/​{filename}`
7. **Policy transitions**: Migration 004 drops and recreates existing policies — this is safe due to idempotency

