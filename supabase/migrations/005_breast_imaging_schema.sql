-- Add breast imaging analysis fields for surgical planning
-- Extends radiology_reports table with comprehensive clinical data extraction

ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS exam_date DATE;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS modality TEXT CHECK (modality IN ('mammography','tomosynthesis','ultrasound','mri','other'));
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS contrast TEXT CHECK (contrast IN ('with','without','not_applicable'));
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS clinical_history TEXT;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::JSONB;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS comparison_dates JSONB DEFAULT '[]'::JSONB;

-- Systemic findings
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS lymph_nodes JSONB DEFAULT '[]'::JSONB;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS skin_nipple_changes JSONB DEFAULT '[]'::JSONB;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS implants JSONB;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS post_surgical_changes JSONB DEFAULT '[]'::JSONB;

-- Disease extent (surgical planning)
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS multifocal BOOLEAN;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS multicentric BOOLEAN;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS bilateral_disease BOOLEAN;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS disease_extent TEXT;

-- Management and correlation
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS management JSONB;
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS pathology_correlation TEXT;

-- Full structured analysis for audit and debugging
ALTER TABLE radiology_reports ADD COLUMN IF NOT EXISTS analysis_json JSONB;
