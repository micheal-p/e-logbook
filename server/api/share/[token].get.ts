import { serverSupabaseServiceRole } from '#supabase/server'

// Public: given a valid share token, return the student's up-to-date report
// data (bio, start date, entries, existing sign-offs). No login required.
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const svc = serverSupabaseServiceRole(event)

  const { data: link } = await svc
    .from('share_links')
    .select('student_id')
    .eq('token', token)
    .maybeSingle()
  if (!link) throw createError({ statusCode: 404, statusMessage: 'This link is invalid or has expired' })

  const sid = link.student_id
  const [{ data: student }, { data: setting }, { data: entries }, { data: signoffs }] =
    await Promise.all([
      svc.from('profiles').select('full_name, matric_no, department, company_name, avatar_url').eq('id', sid).single(),
      svc.from('settings').select('value').eq('key', 'siwes_start_date').maybeSingle(),
      svc.from('entries').select('entry_date, week_number, content, media_url').eq('student_id', sid).order('entry_date'),
      svc.from('signoffs').select('*').eq('student_id', sid),
    ])

  return {
    student,
    startDate: setting?.value || null,
    entries: entries ?? [],
    signoffs: signoffs ?? [],
  }
})
