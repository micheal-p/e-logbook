import { serverSupabaseServiceRole } from '#supabase/server'

// Public: the work supervisor signs off one completed, past week.
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const body = await readBody(event)
  const svc = serverSupabaseServiceRole(event)

  const { data: link } = await svc
    .from('share_links')
    .select('student_id')
    .eq('token', token)
    .maybeSingle()
  if (!link) throw createError({ statusCode: 404, statusMessage: 'Invalid link' })
  const sid = link.student_id

  const { week_number, week_start, week_end, signer_name, signer_role, comment, signature } = body || {}
  if (!week_number || !week_start || !week_end || !signer_name?.trim() || !signer_role?.trim() || !signature) {
    throw createError({ statusCode: 400, statusMessage: 'Name, role and a signature are required' })
  }

  // No future weeks.
  const today = new Date().toISOString().slice(0, 10)
  if (week_end > today) {
    throw createError({ statusCode: 400, statusMessage: 'You can only sign weeks that have already finished' })
  }

  // The week must be complete (all 5 weekdays filled).
  const { data: ents } = await svc
    .from('entries')
    .select('content, entry_date')
    .eq('student_id', sid)
    .gte('entry_date', week_start)
    .lte('entry_date', week_end)
  const filled = (ents ?? []).filter((e) => (e.content || '').trim().length > 0).length
  if (filled < 5) {
    throw createError({ statusCode: 400, statusMessage: 'This week is not complete yet' })
  }

  const { error } = await svc.from('signoffs').upsert(
    {
      student_id: sid,
      week_number,
      week_start,
      week_end,
      signer_name: signer_name.trim(),
      signer_role: signer_role.trim(),
      comment: (comment || '').trim() || null,
      signature,
      signed_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,week_number' }
  )
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { ok: true }
})
