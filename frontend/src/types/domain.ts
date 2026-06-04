export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
}

export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other' | null;
  ethnicity: string | null;
  diagnosis_date: string;
  cancer_type: string;
  cancer_stage: string | null;
  tumor_size_cm: number | null;
  lymph_node_positive: boolean | null;
  er_status: string;
  pr_status: string;
  her2_status: string;
  menopausal_status: string | null;
  initial_treatment_plan: string | null;
  created_at: string;
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

export interface Report {
  id: string;
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
  exam_type: string | null;
  exam_laterality: string | null;
  findings: Finding[] | null;
  recommendations: Recommendation[] | null;
  red_flags: string[] | null;
  created_at: string;
}

export interface Treatment {
  id: string;
  patient_id: string;
  treatment_type: string;
  treatment_start_date: string;
  treatment_end_date: string | null;
  medication_details: string | null;
  treatment_outcome: string | null;
  side_effects: string | null;
  follow_up_date: string | null;
  created_at: string;
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
