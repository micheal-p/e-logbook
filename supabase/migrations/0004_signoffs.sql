-- ============================================================================
--  Work-supervisor sign-off via shareable link.
--  share_links: a token the student sends to their company supervisor.
--  signoffs:    one signature per completed week (name, role, comment, drawing).
-- ============================================================================

create table if not exists public.share_links (
  token       text primary key,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (student_id)
);

create table if not exists public.signoffs (
  id           bigint generated always as identity primary key,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  week_number  int not null,
  week_start   date not null,
  week_end     date not null,
  signer_name  text not null,
  signer_role  text not null,
  comment      text,
  signature    text, -- data URL of the drawn signature (PNG)
  signed_at    timestamptz not null default now(),
  unique (student_id, week_number)
);

alter table public.share_links enable row level security;
alter table public.signoffs    enable row level security;

-- share_links: student manages own; admins read. (Server routes use the
-- service role for the public link flow, which bypasses RLS.)
drop policy if exists share_links_select on public.share_links;
create policy share_links_select on public.share_links for select using (
  student_id = auth.uid() or public.my_role() in ('admin', 'super_admin')
);
drop policy if exists share_links_write on public.share_links;
create policy share_links_write on public.share_links for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- signoffs: visible to the student, their supervisors, and admins. Inserts are
-- done by the public sign page via a service-role server route (bypasses RLS).
drop policy if exists signoffs_select on public.signoffs;
create policy signoffs_select on public.signoffs for select using (
  student_id = auth.uid()
  or public.supervises_student(student_id)
  or public.my_role() in ('admin', 'super_admin')
);
