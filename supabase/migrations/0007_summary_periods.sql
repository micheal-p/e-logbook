-- ============================================================================
--  Monthly summaries are tied to 4-week placement periods, not calendar months.
--  A 24-week SIWES has exactly 6 of them: Month 1 = Weeks 1–4, … Month 6 =
--  Weeks 21–24. We add a `period` (1–6) and relax the old calendar month/year
--  to optional (kept only as a human-readable fallback for legacy rows).
-- ============================================================================

alter table public.summaries add column if not exists period int
  check (period between 1 and 6);

-- Calendar month/year are no longer the source of truth.
alter table public.summaries alter column month drop not null;
alter table public.summaries alter column year  drop not null;

-- One summary per student per 4-week period.
create unique index if not exists summaries_student_period_idx
  on public.summaries (student_id, period) where period is not null;
