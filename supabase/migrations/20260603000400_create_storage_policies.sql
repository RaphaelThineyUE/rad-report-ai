create policy "report objects readable by owner" on storage.objects
  for select
  using (bucket_id = 'reports' and owner = public.current_app_user_id());

create policy "report objects writable by owner" on storage.objects
  for insert
  with check (bucket_id = 'reports' and owner = public.current_app_user_id());

create policy "report objects deletable by owner" on storage.objects
  for delete
  using (bucket_id = 'reports' and owner = public.current_app_user_id());
