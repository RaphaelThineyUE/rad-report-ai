-- Storage bucket: reports (private)
-- Run after creating the bucket in Supabase dashboard or via CLI

-- Users can upload only to their own path prefix
CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read only their own files
CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete only their own files
CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
