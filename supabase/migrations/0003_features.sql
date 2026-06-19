-- ============================================================================
--  Feature additions: SIWES start date (for the countdown).
--  profiles.avatar_url already exists (used for the passport photo).
-- ============================================================================

-- When the student's SIWES begins. Set by the admin during allocation; the
-- 24-week countdown is measured from here.
alter table public.assignments add column if not exists start_date date;
