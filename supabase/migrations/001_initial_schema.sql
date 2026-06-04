-- Users profile table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
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

-- Radiology reports
CREATE TABLE IF NOT EXISTS radiology_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
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

-- Treatment records
CREATE TABLE IF NOT EXISTS treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
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

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_created_at ON audit_logs (user_id, created_at DESC);
