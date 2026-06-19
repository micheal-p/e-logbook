-- ============================================================================
--  In-app notifications.
--
--  A single notifications table, written ONLY by SECURITY DEFINER triggers on
--  the real events (sign-offs, supervisor assignment, approvals, submissions,
--  start-date changes). Because the triggers run as the table owner they
--  bypass RLS, so e.g. a student's action can create a notification addressed
--  to their supervisor — something normal client RLS would (correctly) block.
--
--  Clients can only READ and mark-as-read their OWN rows. Realtime is enabled
--  so the UI can pop a toast the moment a row arrives.
-- ============================================================================

create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade, -- recipient
  type        text not null,                       -- signoff | assignment | approval | submission | schedule
  title       text not null,
  body        text,
  link        text,                                -- where clicking it should go
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Read / mark-read / dismiss only your own. No INSERT policy: clients can never
-- insert; only the definer triggers below do.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select using (user_id = auth.uid());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete using (user_id = auth.uid());

-- Helper: insert one notification (skips null recipients).
create or replace function public.add_notification(
  p_user uuid, p_type text, p_title text, p_body text, p_link text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link);
end $$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- A work/company supervisor signed off a week -> tell the student.
create or replace function public.notify_signoff()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.signed_at is not distinct from old.signed_at then
    return new; -- no actual re-sign
  end if;
  perform public.add_notification(
    new.student_id, 'signoff',
    'Week ' || new.week_number || ' signed',
    coalesce(new.signer_name, 'Your supervisor') || ' signed off your Week ' || new.week_number || '.',
    '/student'
  );
  return new;
end $$;
drop trigger if exists signoffs_notify on public.signoffs;
create trigger signoffs_notify after insert or update on public.signoffs
  for each row execute function public.notify_signoff();

-- An academic supervisor was assigned/changed -> tell the student AND the
-- newly-assigned supervisor.
create or replace function public.notify_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare sup_name text; stu_name text;
begin
  if tg_op = 'UPDATE' and new.supervisor_id is not distinct from old.supervisor_id then
    return new;
  end if;
  if new.supervisor_id is null then return new; end if;

  select full_name into sup_name from public.profiles where id = new.supervisor_id;
  select full_name into stu_name from public.profiles where id = new.student_id;

  perform public.add_notification(
    new.student_id, 'assignment',
    'Academic supervisor assigned',
    'You have been assigned to ' || coalesce(sup_name, 'a supervisor') || ' as your academic supervisor.',
    '/student'
  );
  perform public.add_notification(
    new.supervisor_id, 'assignment',
    'New student assigned',
    coalesce(stu_name, 'A student') || ' has been assigned to you.',
    '/supervisor'
  );
  return new;
end $$;
drop trigger if exists assignments_notify on public.assignments;
create trigger assignments_notify after insert or update on public.assignments
  for each row execute function public.notify_assignment();

-- A supervisor stamped (approved) an entry or summary -> tell the student.
create or replace function public.notify_approval()
returns trigger language plpgsql security definer set search_path = public as $$
declare stu uuid; who text; what text;
begin
  if not new.stamped then return new; end if;
  if tg_op = 'UPDATE' and old.stamped then return new; end if; -- already stamped

  stu := public.target_student(new.entry_id, new.summary_id);
  select full_name into who from public.profiles where id = new.approver_id;
  what := case when new.entry_id is not null then 'a logbook entry' else 'a monthly summary' end;

  perform public.add_notification(
    stu, 'approval',
    'Work approved',
    coalesce(who, 'Your supervisor') || ' approved ' || what || '.',
    '/student'
  );
  return new;
end $$;
drop trigger if exists approvals_notify on public.approvals;
create trigger approvals_notify after insert or update on public.approvals
  for each row execute function public.notify_approval();

-- A student submitted a monthly summary for review -> tell their academic
-- supervisor.
create or replace function public.notify_summary_submit()
returns trigger language plpgsql security definer set search_path = public as $$
declare sup uuid; stu_name text;
begin
  if new.status <> 'submitted' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'submitted' then return new; end if;

  select supervisor_id into sup from public.assignments where student_id = new.student_id;
  if sup is null then return new; end if;
  select full_name into stu_name from public.profiles where id = new.student_id;

  perform public.add_notification(
    sup, 'submission',
    'Summary submitted for review',
    coalesce(stu_name, 'A student') || ' submitted a monthly summary for your review.',
    '/supervisor'
  );
  return new;
end $$;
drop trigger if exists summaries_notify on public.summaries;
create trigger summaries_notify after insert or update on public.summaries
  for each row execute function public.notify_summary_submit();

-- The cohort-wide SIWES start date was set/changed -> tell every student.
create or replace function public.notify_schedule()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.key <> 'siwes_start_date' then return new; end if;
  if new.value is null then return new; end if;
  if tg_op = 'UPDATE' and new.value is not distinct from old.value then return new; end if;

  insert into public.notifications (user_id, type, title, body, link)
  select p.id, 'schedule', 'SIWES start date set',
         'Your SIWES start date has been set to ' || new.value || '. Your weekly logbook is now open.',
         '/student'
  from public.profiles p where p.role = 'student';
  return new;
end $$;
drop trigger if exists settings_notify on public.settings;
create trigger settings_notify after insert or update on public.settings
  for each row execute function public.notify_schedule();

-- ---------------------------------------------------------------------------
-- Realtime: let the client subscribe to its own new notifications.
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
