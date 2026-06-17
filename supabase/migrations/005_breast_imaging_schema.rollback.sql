-- Rollback 005_breast_imaging_schema.sql
-- This removes all breast imaging columns added to radiology_reports table
-- NOTE: Any data in these columns will be lost

ALTER TABLE radiology_reports DROP COLUMN IF EXISTS exam_date;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS modality;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS contrast;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS clinical_history;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS risk_factors;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS comparison_dates;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS lymph_nodes;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS skin_nipple_changes;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS implants;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS post_surgical_changes;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS multifocal;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS multicentric;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS bilateral_disease;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS disease_extent;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS management;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS pathology_correlation;
ALTER TABLE radiology_reports DROP COLUMN IF EXISTS analysis_json;
