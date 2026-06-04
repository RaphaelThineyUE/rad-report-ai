# Database Schema

Supabase project: `ghdgkthminenqniqhjjx`

All tables must be created by running the SQL below in the Supabase SQL editor (or via Supabase CLI migrations). RLS must be enabled on every table.

---

## Tables

### `users`

> Managed by Supabase Auth. The `auth.users` table is built-in. A separate `users` profile table mirrors display metadata.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `patients`

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  ethnicity TEXT,
  diagnosis_date DATE NOT NULL,
  cancer_type TEXT NOT NULL,
  cancer_stage TEXT CHECK (cancer_stage IN ('Stage 0','Stage I','Stage II','Stage III','Stage IV','Unknown')),
  tumor_size_cm NUMERIC,
  lymph_node_positive BOOLEAN,
  er_status TEXT CHECK (er_status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown',
  pr_status TEXT CHECK (pr_status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown',
  her2_status TEXT CHECK (her2_status IN ('Positive','Negative','Unknown')) DEFAULT 'Unknown',
  menopausal_status TEXT,
  initial_treatment_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `radiology_reports`

```sql
CREATE TABLE radiology_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  status TEXT CHECK (status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
  summary TEXT,
  birads_value INTEGER,
  birads_confidence TEXT CHECK (birads_confidence IN ('low','medium','high')),
  birads_evidence JSONB,
  breast_density_value TEXT,
  breast_density_evidence JSONB,
  exam_type TEXT,
  exam_laterality TEXT,
  exam_evidence JSONB,
  comparison_prior_exam_date TEXT,
  comparison_evidence JSONB,
  findings JSONB,
  recommendations JSONB,
  red_flags JSONB,
  processing_time_ms INTEGER,
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, filename)
);
```

> The `UNIQUE (patient_id, filename)` constraint prevents duplicate uploads. The API also checks for duplicates before writing and returns `409 Conflict` on collision.

### `treatment_records`

```sql
CREATE TABLE treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id),
  patient_id UUID REFERENCES patients(id),
  treatment_type TEXT CHECK (treatment_type IN (
    'Surgery','Chemotherapy','Radiation',
    'Hormone Therapy','Targeted Therapy','Immunotherapy','Other'
  )),
  treatment_start_date DATE NOT NULL,
  treatment_end_date DATE,
  medication_details TEXT,
  treatment_outcome TEXT CHECK (treatment_outcome IN (
    'Complete Response','Partial Response','Stable Disease',
    'Progressive Disease','Recurrence','Remission','Other'
  )),
  side_effects TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_logs_user_id_created_at ON audit_logs (user_id, created_at DESC);
```

---

## Row Level Security

Enable RLS and add ownership policies on each table:

```sql
-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- patients
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (auth.uid() = created_by);

-- radiology_reports
CREATE POLICY "reports_select" ON radiology_reports FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "reports_insert" ON radiology_reports FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "reports_update" ON radiology_reports FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "reports_delete" ON radiology_reports FOR DELETE USING (auth.uid() = created_by);

-- treatment_records
CREATE POLICY "treatments_select" ON treatment_records FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "treatments_insert" ON treatment_records FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "treatments_update" ON treatment_records FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "treatments_delete" ON treatment_records FOR DELETE USING (auth.uid() = created_by);

-- audit_logs: users see only their own; admins see all
CREATE POLICY "audit_select_own" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Supabase Storage

Bucket: `reports` (private)

Path convention: `{userId}/{patientId}/{filename}`

Storage policies:

```sql
-- Users can upload only to their own path prefix
CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read only their own files
CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete only their own files
CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Generating TypeScript types

```bash
npx supabase gen types typescript --project-id ghdgkthminenqniqhjjx > shared/types/database.ts
```
