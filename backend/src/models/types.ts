export interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface PatientRecord {
  id: string;
  created_by: string;
  full_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other' | null;
  ethnicity: string | null;
  diagnosis_date: string;
  cancer_type: string;
  cancer_stage: 'Stage 0' | 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV' | 'Unknown' | null;
  tumor_size_cm: number | null;
  lymph_node_positive: boolean | null;
  er_status: 'Positive' | 'Negative' | 'Unknown';
  pr_status: 'Positive' | 'Negative' | 'Unknown';
  her2_status: 'Positive' | 'Negative' | 'Unknown';
  menopausal_status: string | null;
  initial_treatment_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface RadiologyReportRecord {
  id: string;
  created_by: string;
  patient_id: string;
  filename: string;
  file_url: string | null;
  file_size: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary: string | null;
  birads_value: number | null;
  birads_confidence: 'low' | 'medium' | 'high' | null;
  birads_evidence: string[] | null;
  breast_density_value: string | null;
  breast_density_evidence: string[] | null;
  exam_type: string | null;
  exam_laterality: string | null;
  exam_evidence: string[] | null;
  comparison_prior_exam_date: string | null;
  comparison_evidence: string[] | null;
  findings: ClaudeFinding[] | null;
  recommendations: ClaudeRecommendation[] | null;
  red_flags: string[] | null;
  processing_time_ms: number | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
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
  treatment_end_date: string | null;
  medication_details: string | null;
  treatment_outcome:
    | 'Complete Response'
    | 'Partial Response'
    | 'Stable Disease'
    | 'Progressive Disease'
    | 'Recurrence'
    | 'Remission'
    | 'Other'
    | null;
  side_effects: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaudeFinding {
  laterality: string;
  location: string;
  description: string;
  assessment: string;
  evidence: string[];
}

export interface ClaudeRecommendation {
  action: string;
  timeframe: string;
  evidence: string[];
}

export interface ClaudeReportAnalysis {
  birads: { value: number; confidence: 'low' | 'medium' | 'high'; evidence: string[] };
  breast_density: { value: string; evidence: string[] };
  exam: { type: string; laterality: string; evidence: string[] };
  comparison: { prior_exam_date: string | null; evidence: string[] };
  findings: ClaudeFinding[];
  recommendations: ClaudeRecommendation[];
  red_flags: string[];
}

export interface TreatmentComparisonResult {
  options: Array<{
    name: string;
    score: number;
    efficacy: string;
    benefits: string[];
    side_effects: string[];
    duration: string;
    considerations: string[];
  }>;
  overall_recommendation: string;
  disclaimer: string;
}
