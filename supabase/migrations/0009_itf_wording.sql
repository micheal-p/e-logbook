-- ============================================================================
--  Wording: the end-of-SIWES document carries the ITF (Industrial Training
--  Fund) stamp. Update the completion notification text to match.
-- ============================================================================
create or replace function public.notify_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare sup uuid; stu text; who text;
begin
  if new.stamped_report_url is not null
     and (tg_op = 'INSERT' or new.stamped_report_url is distinct from old.stamped_report_url) then
    select supervisor_id into sup from public.assignments where student_id = new.student_id;
    select full_name into stu from public.profiles where id = new.student_id;
    perform public.add_notification(
      sup, 'completion', 'ITF-stamped report uploaded',
      coalesce(stu, 'A student') || ' uploaded their ITF-stamped report for final SIWES approval.',
      '/supervisor'
    );
  end if;

  if new.academic_approved and (tg_op = 'INSERT' or not coalesce(old.academic_approved, false)) then
    select full_name into who from public.profiles where id = new.academic_approver_id;
    perform public.add_notification(
      new.student_id, 'completion', 'SIWES approved 🎓',
      coalesce(who, 'Your supervisor') || ' approved your SIWES. You can now download your completion certificate.',
      '/student'
    );
  end if;
  return new;
end $$;
