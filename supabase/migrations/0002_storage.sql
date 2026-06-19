-- ============================================================================
--  Storage bucket for entry images / diagrams.
--  Run after 0001_init.sql. (You can also create the bucket in the dashboard
--  under Storage; this just does it in SQL so it's reproducible.)
-- ============================================================================

-- Public bucket so <img src> works with a plain public URL. Uploads are still
-- restricted to authenticated users writing into their own folder.
insert into storage.buckets (id, name, public)
values ('logbook-media', 'logbook-media', true)
on conflict (id) do nothing;

-- Students upload into a folder named after their user id: "<uid>/<file>".
drop policy if exists "logbook upload own" on storage.objects;
create policy "logbook upload own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logbook-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logbook read" on storage.objects;
create policy "logbook read" on storage.objects for select to authenticated
  using (bucket_id = 'logbook-media');

drop policy if exists "logbook update own" on storage.objects;
create policy "logbook update own" on storage.objects for update to authenticated
  using (bucket_id = 'logbook-media' and owner = auth.uid());

drop policy if exists "logbook delete own" on storage.objects;
create policy "logbook delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'logbook-media' and owner = auth.uid());
