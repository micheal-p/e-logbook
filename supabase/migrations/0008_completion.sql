-- ============================================================================
--  SIWES completion flow (one row per student):
--    1. student prints the logbook report, gets it stamped by the company,
--       then scans & uploads it           -> stamped_report_url
--    2. the assigned academic supervisor reviews and gives ONE final approval
--       with a signature                   -> academic_approved + signature
--    3. the student can then download a generated completion certificate.
-- ============================================================================

create table if not exists public.completions (
  student_id           uuid primary key references public.profiles (id) on delete cascade,
  stamped_report_url   text,
  stamped_uploaded_at  timestamptz,
  academic_approved    boolean not null default false,
  academic_approver_id uuid references public.profiles (id) on delete set null,
  academic_signature   text,
  academic_comment     text,
  approved_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.completions enable row level security;

-- READ: the student, their supervisors, admins.
drop policy if exists completions_select on public.completions;
create policy completions_select on public.completions for select using (
  student_id = auth.uid()
  or public.supervises_student(student_id)
  or public.my_role() in ('admin', 'super_admin')
);

-- The student creates/updates their own row (to upload the stamped report). A
-- guard trigger stops them from flipping the academic-approval fields.
drop policy if exists completions_student_insert on public.completions;
create policy completions_student_insert on public.completions for insert
  with check (student_id = auth.uid() and public.my_role() = 'student');
drop policy if exists completions_student_update on public.completions;
create policy completions_student_update on public.completions for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- The assigned academic supervisor (or super admin) updates the row to approve.
drop policy if exists completions_supervisor_update on public.completions;
create policy completions_supervisor_update on public.completions for update
  using (public.supervises_student(student_id) or public.my_role() = 'super_admin')
  with check (public.supervises_student(student_id) or public.my_role() = 'super_admin');

-- Guard: students can never approve their own completion; supervisors approving
-- are stamped as the approver and get an approved_at timestamp.
create or replace function public.guard_completion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = new.student_id then
    if coalesce(new.academic_approved, false) is distinct from coalesce(old.academic_approved, false)
       or new.academic_signature   is distinct from old.academic_signature
       or new.academic_approver_id is distinct from old.academic_approver_id then
      raise exception 'Students cannot approve their own SIWES completion';
    end if;
  else
    if new.academic_approved and new.academic_approver_id is null then
      new.academic_approver_id := auth.uid();
    end if;
    if new.academic_approved and not coalesce(old.academic_approved, false) then
      new.approved_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists completions_guard on public.completions;
create trigger completions_guard before insert or update on public.completions
  for each row execute function public.guard_completion();

-- Notifications: stamped report uploaded -> supervisor; approved -> student.
create or replace function public.notify_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare sup uuid; stu text; who text;
begin
  if new.stamped_report_url is not null
     and (tg_op = 'INSERT' or new.stamped_report_url is distinct from old.stamped_report_url) then
    select supervisor_id into sup from public.assignments where student_id = new.student_id;
    select full_name into stu from public.profiles where id = new.student_id;
    perform public.add_notification(
      sup, 'completion', 'Stamped report uploaded',
      coalesce(stu, 'A student') || ' uploaded their stamped report for final SIWES approval.',
      '/supervisor'
    );
  end if;

  if new.academic_approved and (tg_op = 'INSERT' or not coalesce(old.academic_approved, false)) then
    select full_name into who from public.profiles where id = new.academic_approver_id;
    perform public.add_notification(
      new.student_id, 'completion', 'SIWES approved',
      coalesce(who, 'Your supervisor') || ' approved your SIWES. You can now download your completion certificate.',
      '/student'
    );
  end if;
  return new;
end $$;
drop trigger if exists completions_notify on public.completions;
create trigger completions_notify after insert or update on public.completions
  for each row execute function public.notify_completion();
