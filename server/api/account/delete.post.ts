import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// Lets a signed-in user delete their OWN account. Deleting the auth user
// cascades to their profile, entries, summaries, comments and approvals
// (all FK ON DELETE CASCADE).
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Not signed in' })

  const svc = serverSupabaseServiceRole(event)
  const { error } = await svc.auth.admin.deleteUser(user.id)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  return { ok: true }
})
