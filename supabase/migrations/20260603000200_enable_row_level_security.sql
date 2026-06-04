alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.radiology_reports enable row level security;
alter table public.treatment_records enable row level security;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
as $$
  select coalesce(auth.uid(), nullif(current_setting('request.jwt.claim.sub', true), '')::uuid)
$$;

create policy "users manage own profile" on public.users
  for all
  using (id = public.current_app_user_id())
  with check (id = public.current_app_user_id());

create policy "patients manage own records" on public.patients
  for all
  using (created_by = public.current_app_user_id())
  with check (created_by = public.current_app_user_id());

create policy "reports manage own records" on public.radiology_reports
  for all
  using (created_by = public.current_app_user_id())
  with check (created_by = public.current_app_user_id());

create policy "treatments manage own records" on public.treatment_records
  for all
  using (created_by = public.current_app_user_id())
  with check (created_by = public.current_app_user_id());
