insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;
