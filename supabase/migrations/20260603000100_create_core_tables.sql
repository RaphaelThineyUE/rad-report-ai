create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  password_hash text not null,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.users(id),
  full_name text not null,
  date_of_birth date not null,
  gender text check (gender in ('Male', 'Female', 'Other')),
  ethnicity text,
  diagnosis_date date not null,
  cancer_type text not null,
  cancer_stage text check (cancer_stage in ('Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown')),
  tumor_size_cm numeric,
  lymph_node_positive boolean,
  er_status text check (er_status in ('Positive', 'Negative', 'Unknown')) default 'Unknown',
  pr_status text check (pr_status in ('Positive', 'Negative', 'Unknown')) default 'Unknown',
  her2_status text check (her2_status in ('Positive', 'Negative', 'Unknown')) default 'Unknown',
  menopausal_status text,
  initial_treatment_plan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.radiology_reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.users(id),
  patient_id uuid references public.patients(id) not null,
  filename text not null,
  file_url text,
  file_size integer,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  summary text,
  birads_value integer,
  birads_confidence text check (birads_confidence in ('low', 'medium', 'high')),
  birads_evidence jsonb,
  breast_density_value text,
  breast_density_evidence jsonb,
  exam_type text,
  exam_laterality text,
  exam_evidence jsonb,
  comparison_prior_exam_date text,
  comparison_evidence jsonb,
  findings jsonb,
  recommendations jsonb,
  red_flags jsonb,
  processing_time_ms integer,
  raw_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (patient_id, filename)
);

create table if not exists public.treatment_records (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.users(id),
  patient_id uuid references public.patients(id),
  treatment_type text check (treatment_type in ('Surgery', 'Chemotherapy', 'Radiation', 'Hormone Therapy', 'Targeted Therapy', 'Immunotherapy', 'Other')),
  treatment_start_date date not null,
  treatment_end_date date,
  medication_details text,
  treatment_outcome text check (treatment_outcome in ('Complete Response', 'Partial Response', 'Stable Disease', 'Progressive Disease', 'Recurrence', 'Remission', 'Other')),
  side_effects text,
  follow_up_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
