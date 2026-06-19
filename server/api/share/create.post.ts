import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { randomUUID } from 'node:crypto'

// The signed-in student creates (or re-uses) their shareable sign-off link.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const uid = (user as any)?.sub ?? (user as any)?.id // v2 returns JWT claims (sub = user id)
  if (!uid) throw createError({ statusCode: 401, statusMessage: 'Not signed in' })

  const svc = serverSupabaseServiceRole(event)
  const { data: existing } = await svc
    .from('share_links')
    .select('token')
    .eq('student_id', uid)
    .maybeSingle()

  let token = existing?.token
  if (!token) {
    token = (randomUUID() + randomUUID()).replace(/-/g, '')
    const { error } = await svc.from('share_links').insert({ token, student_id: uid })
    if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  }
  return { token }
})
