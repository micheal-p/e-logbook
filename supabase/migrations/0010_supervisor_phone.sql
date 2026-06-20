-- ============================================================================
--  Contact phone number for profiles.
--  Collected when an admin creates a supervisor (academic or company) account,
--  and shown to each student for their assigned supervisors. RLS already lets a
--  student read their supervisors' profiles via is_my_supervisor(), so no policy
--  change is needed — the new column rides along on the existing SELECT.
-- ============================================================================
alter table public.profiles add column if not exists phone text;
