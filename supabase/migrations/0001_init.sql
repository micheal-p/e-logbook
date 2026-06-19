-- ============================================================================
--  Caleb University E-Logbook — schema, RLS, triggers
--  Run this whole file in: Supabase dashboard -> SQL Editor -> New query.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Role enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum
    ('super_admin', 'admin', 'supervisor', 'company_supervisor', 'student');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  role          public.user_role not null default 'student',
  email         text,
  matric_no     text,
  department    text,
  company_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

create table if not exists public.assignments (
  id                    bigint generated always as identity primary key,
  student_id            uuid not null references public.profiles (id) on delete cascade,
  supervisor_id         uuid references public.profiles (id) on delete set null,
  company_supervisor_id uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  unique (student_id) -- one assignment row per student
);

create table if not exists public.entries (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  entry_date  date not null,
  week_number int,
  content     text not null default '',
  media_url   text,
  status      text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists entries_student_date_idx on public.entries (student_id, entry_date desc);

create table if not exists public.summaries (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  month       int not null check (month between 1 and 12),
  year        int not null,
  content     text not null default '',
  status      text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at  timestamptz not null default now()
);
create index if not exists summaries_student_idx on public.summaries (student_id, year desc, month desc);

create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  entry_id    bigint references public.entries (id) on delete cascade,
  summary_id  bigint references public.summaries (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  check (num_nonnulls(entry_id, summary_id) = 1) -- exactly one target
);
create index if not exists comments_entry_idx on public.comments (entry_id);
create index if not exists comments_summary_idx on public.comments (summary_id);

create table if not exists public.approvals (
  id          bigint generated always as identity primary key,
  entry_id    bigint references public.entries (id) on delete cascade,
  summary_id  bigint references public.summaries (id) on delete cascade,
  approver_id uuid not null references public.profiles (id) on delete cascade,
  role        public.user_role not null,
  grade       text,
  stamped     boolean not null default false,
  stamped_at  timestamptz,
  created_at  timestamptz not null default now(),
  check (num_nonnulls(entry_id, summary_id) = 1)
);
-- one approval row per (target, approver) so the app can update-in-place
create unique index if not exists approvals_entry_approver_idx
  on public.approvals (entry_id, approver_id) where entry_id is not null;
create unique index if not exists approvals_summary_approver_idx
  on public.approvals (summary_id, approver_id) where summary_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Helper functions (SECURITY DEFINER so they bypass RLS and never recurse
--    when called from inside a policy).
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid()
$$;

-- True if the given student is assigned to the current user (as academic OR
-- company supervisor).
create or replace function public.supervises_student(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assignments a
    where a.student_id = student
      and (a.supervisor_id = auth.uid() or a.company_supervisor_id = auth.uid())
  )
$$;

-- True if the given profile is one of the current student's supervisors
-- (lets a student read their supervisors' names).
create or replace function public.is_my_supervisor(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assignments a
    where a.student_id = auth.uid()
      and (a.supervisor_id = p or a.company_supervisor_id = p)
  )
$$;

-- The student who owns the entry/summary a comment or approval points at.
create or replace function public.target_student(p_entry bigint, p_summary bigint)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select student_id from public.entries    where id = p_entry),
    (select student_id from public.summaries  where id = p_summary)
  )
$$;

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.assignments enable row level security;
alter table public.entries     enable row level security;
alter table public.summaries   enable row level security;
alter table public.comments    enable row level security;
alter table public.approvals   enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Policies
-- ---------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.my_role() in ('admin', 'super_admin')
  or public.supervises_student(id)   -- I'm a supervisor; this is my student
  or public.is_my_supervisor(id)     -- I'm a student; this is my supervisor
);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());

-- Self can edit own profile; admins can edit anyone (e.g. promote a role).
-- A trigger (below) stops non-admins from changing their OWN role.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.my_role() in ('admin', 'super_admin'))
  with check (id = auth.uid() or public.my_role() in ('admin', 'super_admin'));

-- assignments ---------------------------------------------------------------
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select using (
  public.my_role() in ('admin', 'super_admin')
  or student_id = auth.uid()
  or supervisor_id = auth.uid()
  or company_supervisor_id = auth.uid()
);

drop policy if exists assignments_write on public.assignments;
create policy assignments_write on public.assignments for all
  using (public.my_role() in ('admin', 'super_admin'))
  with check (public.my_role() in ('admin', 'super_admin'));

-- entries -------------------------------------------------------------------
-- READ: owner, that student's supervisors, admins/super.
drop policy if exists entries_select on public.entries;
create policy entries_select on public.entries for select using (
  student_id = auth.uid()
  or public.supervises_student(student_id)
  or public.my_role() in ('admin', 'super_admin')
);
-- WRITE: only the owning student. No UPDATE/DELETE policy exists for any other
-- role, so supervisors/admins physically cannot edit or delete entries.
drop policy if exists entries_insert on public.entries;
create policy entries_insert on public.entries for insert
  with check (student_id = auth.uid() and public.my_role() = 'student');
drop policy if exists entries_update on public.entries;
create policy entries_update on public.entries for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists entries_delete on public.entries;
create policy entries_delete on public.entries for delete using (student_id = auth.uid());

-- summaries (same shape as entries) -----------------------------------------
drop policy if exists summaries_select on public.summaries;
create policy summaries_select on public.summaries for select using (
  student_id = auth.uid()
  or public.supervises_student(student_id)
  or public.my_role() in ('admin', 'super_admin')
);
drop policy if exists summaries_insert on public.summaries;
create policy summaries_insert on public.summaries for insert
  with check (student_id = auth.uid() and public.my_role() = 'student');
drop policy if exists summaries_update on public.summaries;
create policy summaries_update on public.summaries for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists summaries_delete on public.summaries;
create policy summaries_delete on public.summaries for delete using (student_id = auth.uid());

-- comments ------------------------------------------------------------------
-- Anyone who can see the target can read its comments.
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select using (
  public.target_student(entry_id, summary_id) = auth.uid()
  or public.supervises_student(public.target_student(entry_id, summary_id))
  or public.my_role() in ('admin', 'super_admin')
);
-- You may comment on a target you can see, as yourself.
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (
  author_id = auth.uid()
  and (
    public.target_student(entry_id, summary_id) = auth.uid()
    or public.supervises_student(public.target_student(entry_id, summary_id))
    or public.my_role() in ('admin', 'super_admin')
  )
);
drop policy if exists comments_update on public.comments;
create policy comments_update on public.comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete using (author_id = auth.uid());

-- approvals -----------------------------------------------------------------
drop policy if exists approvals_select on public.approvals;
create policy approvals_select on public.approvals for select using (
  public.target_student(entry_id, summary_id) = auth.uid()
  or public.supervises_student(public.target_student(entry_id, summary_id))
  or public.my_role() in ('admin', 'super_admin')
);
-- Only supervisors / company supervisors / super admin may stamp, and only on
-- a student they supervise (super admin may stamp anything). Students cannot
-- approve their own work.
drop policy if exists approvals_insert on public.approvals;
create policy approvals_insert on public.approvals for insert with check (
  approver_id = auth.uid()
  and role::text = public.my_role()
  and public.my_role() in ('supervisor', 'company_supervisor', 'super_admin')
  and (
    public.supervises_student(public.target_student(entry_id, summary_id))
    or public.my_role() = 'super_admin'
  )
);
drop policy if exists approvals_update on public.approvals;
create policy approvals_update on public.approvals for update
  using (approver_id = auth.uid()) with check (approver_id = auth.uid());
drop policy if exists approvals_delete on public.approvals;
create policy approvals_delete on public.approvals for delete using (approver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Triggers
-- ---------------------------------------------------------------------------

-- Auto-create a 'student' profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, matric_no, department, company_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'matric_no', ''),
    nullif(new.raw_user_meta_data ->> 'department', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop a non-admin from changing their own role (privilege escalation guard).
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and public.my_role() not in ('admin', 'super_admin') then
    raise exception 'Only admins can change a role';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_role_update on public.profiles;
create trigger guard_profile_role_update
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Keep entries.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch
  before update on public.entries
  for each row execute function public.touch_updated_at();
