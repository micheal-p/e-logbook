-- ============================================================================
--  Global app settings (key/value). Holds the single, cohort-wide SIWES start
--  date that applies to every student.
-- ============================================================================
create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values ('siwes_start_date', null)
  on conflict (key) do nothing;

alter table public.settings enable row level security;

-- Any signed-in user can read settings; only admins can change them.
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select using (auth.uid() is not null);

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all
  using (public.my_role() in ('admin', 'super_admin'))
  with check (public.my_role() in ('admin', 'super_admin'));
