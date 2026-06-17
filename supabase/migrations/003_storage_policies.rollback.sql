-- Rollback 003_storage_policies.sql
-- This removes storage bucket policies created in the migration
-- NOTE: The 'reports' storage bucket itself is NOT deleted (managed separately)

DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
