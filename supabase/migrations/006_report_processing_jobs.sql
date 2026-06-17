ALTER TABLE radiology_reports
ADD COLUMN IF NOT EXISTS processing_stage TEXT,
ADD COLUMN IF NOT EXISTS processing_progress INTEGER NOT NULL DEFAULT 0 CHECK (processing_progress BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_error TEXT;

UPDATE radiology_reports
SET
  processing_stage = CASE
    WHEN status = 'pending' THEN 'queued'
    WHEN status = 'processing' THEN 'processing'
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'failed' THEN 'failed'
    ELSE COALESCE(processing_stage, 'queued')
  END,
  processing_progress = CASE
    WHEN status = 'completed' THEN 100
    WHEN status = 'failed' THEN processing_progress
    ELSE COALESCE(processing_progress, 0)
  END,
  queued_at = COALESCE(queued_at, created_at),
  started_at = CASE
    WHEN status IN ('processing', 'completed', 'failed') THEN COALESCE(started_at, updated_at, created_at)
    ELSE started_at
  END,
  completed_at = CASE
    WHEN status = 'completed' THEN COALESCE(completed_at, updated_at, created_at)
    ELSE completed_at
  END
WHERE processing_stage IS NULL
   OR queued_at IS NULL
   OR (status = 'completed' AND completed_at IS NULL);

CREATE TABLE IF NOT EXISTS report_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES radiology_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',
  stage TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  worker_id TEXT,
  lease_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id)
);

CREATE INDEX IF NOT EXISTS report_processing_jobs_status_created_idx
  ON report_processing_jobs(status, created_at);

CREATE INDEX IF NOT EXISTS report_processing_jobs_lease_idx
  ON report_processing_jobs(lease_expires_at);

INSERT INTO report_processing_jobs (
  report_id,
  status,
  stage,
  progress,
  attempts,
  started_at,
  completed_at,
  last_error,
  created_at,
  updated_at
)
SELECT
  id,
  CASE
    WHEN status = 'pending' THEN 'queued'
    WHEN status = 'processing' THEN 'processing'
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'failed' THEN 'failed'
    ELSE 'queued'
  END,
  COALESCE(processing_stage, 'queued'),
  COALESCE(processing_progress, CASE WHEN status = 'completed' THEN 100 ELSE 0 END),
  0,
  started_at,
  completed_at,
  last_error,
  COALESCE(queued_at, created_at),
  updated_at
FROM radiology_reports
ON CONFLICT (report_id) DO NOTHING;

CREATE OR REPLACE FUNCTION claim_next_report_processing_job(
  p_worker_id TEXT,
  p_lease_seconds INTEGER DEFAULT 900
)
RETURNS TABLE (
  job_id UUID,
  report_id UUID,
  status TEXT,
  stage TEXT,
  progress INTEGER,
  attempts INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH next_job AS (
    SELECT j.id
    FROM report_processing_jobs j
    WHERE j.attempts < j.max_attempts
      AND (
        j.status = 'queued'
        OR (
          j.status = 'processing'
          AND j.lease_expires_at IS NOT NULL
          AND j.lease_expires_at < NOW()
        )
      )
    ORDER BY j.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  ),
  claimed AS (
    UPDATE report_processing_jobs j
    SET
      status = 'processing',
      stage = CASE WHEN j.stage IN ('completed', 'failed') THEN 'queued' ELSE j.stage END,
      progress = CASE WHEN j.status = 'completed' THEN 0 ELSE j.progress END,
      attempts = j.attempts + 1,
      worker_id = p_worker_id,
      lease_expires_at = NOW() + make_interval(secs => GREATEST(p_lease_seconds, 30)),
      started_at = COALESCE(j.started_at, NOW()),
      completed_at = NULL,
      updated_at = NOW(),
      last_error = NULL
    WHERE j.id IN (SELECT id FROM next_job)
    RETURNING j.id, j.report_id, j.status, j.stage, j.progress, j.attempts
  )
  SELECT claimed.id, claimed.report_id, claimed.status, claimed.stage, claimed.progress, claimed.attempts
  FROM claimed;
END;
$$;
