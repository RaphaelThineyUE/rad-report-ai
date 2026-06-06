/**
 * Shared TypeScript types for the rad-report-ai monorepo.
 * Used by both frontend and backend to ensure consistent data shapes across the API boundary.
 * Exports: Patient, RadiologyReport, Finding, Recommendation, TreatmentRecord, User, BirasTrend.
 * BI-RADS value is numeric 0–6; BirasTrend is a deterministic derivation (no AI call).
 */
export interface Patient {
  id: string;
  created_by: string;
  full_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  ethnicity?: string;
  diagnosis_date: string;
  cancer_type: string;
  cancer_stage: 'Stage 0' | 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV' | 'Unknown';
  tumor_size_cm?: number;
  lymph_node_positive?: boolean;
  er_status: 'Positive' | 'Negative' | 'Unknown';
  pr_status: 'Positive' | 'Negative' | 'Unknown';
  her2_status: 'Positive' | 'Negative' | 'Unknown';
  menopausal_status?: string;
  initial_treatment_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface RadiologyReport {
  id: string;
  created_by: string;
  patient_id: string;
  filename: string;
  file_url?: string;
  file_size?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: string;
  birads_value?: number;
  birads_confidence?: 'low' | 'medium' | 'high';
  birads_evidence?: string[];
  breast_density_value?: string;
  breast_density_evidence?: string[];
  exam_type?: string;
  exam_laterality?: string;
  exam_evidence?: string[];
  comparison_prior_exam_date?: string;
  comparison_evidence?: string[];
  findings?: Finding[];
  recommendations?: Recommendation[];
  red_flags?: string[];
  processing_time_ms?: number;
  raw_text?: string;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  laterality: string;
  location: string;
  description: string;
  assessment: string;
  evidence: string[];
}

export interface Recommendation {
  action: string;
  timeframe: string;
  evidence: string[];
}

export interface TreatmentRecord {
  id: string;
  created_by: string;
  patient_id: string;
  treatment_type:
    | 'Surgery'
    | 'Chemotherapy'
    | 'Radiation'
    | 'Hormone Therapy'
    | 'Targeted Therapy'
    | 'Immunotherapy'
    | 'Other';
  treatment_start_date: string;
  treatment_end_date?: string;
  medication_details?: string;
  treatment_outcome?:
    | 'Complete Response'
    | 'Partial Response'
    | 'Stable Disease'
    | 'Progressive Disease'
    | 'Recurrence'
    | 'Remission'
    | 'Other';
  side_effects?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
}

export type BirasTrend = 'improving' | 'worsening' | 'stable' | 'insufficient_data';
