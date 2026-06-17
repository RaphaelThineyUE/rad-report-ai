-- Rollback 001_initial_schema.sql
-- This removes the initial schema created by 001_initial_schema.sql
-- WARNING: This will delete all data in these tables if the migration was applied

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS treatment_records CASCADE;
DROP TABLE IF EXISTS radiology_reports CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
