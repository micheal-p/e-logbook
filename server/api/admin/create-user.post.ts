import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// Admin-only: create a login account for a lecturer (academic or company
// supervisor) — or any role. Runs server-side with the service-role key so the
// secret never reaches the browser. The caller must be a signed-in admin.
const ALLOWED_ROLES = ['supervisor', 'company_supervisor', 'student', 'admin'] as const

export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, statusMessage: 'Not signed in' })

  const admin = serverSupabaseServiceRole(event)

  // Verify the caller is an admin / super admin.
  const { data: me } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admins only' })
  }

  const body = await readBody(event)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const full_name = String(body?.full_name ?? '').trim()
  const role = String(body?.role ?? '')
  const department = String(body?.department ?? '').trim()
  const company_name = String(body?.company_name ?? '').trim()

  if (!email || !password || password.length < 6 || !ALLOWED_ROLES.includes(role as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid name, email, password (min 6) or role' })
  }

  // Create the auth user with email already confirmed so they can log in now.
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })
  if (error || !created?.user) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Could not create user' })
  }

  // The handle_new_user trigger inserts a 'student' profile; upsert the real
  // role + details on top of it.
  const { error: e2 } = await admin.from('profiles').upsert({
    id: created.user.id,
    email,
    full_name: full_name || null,
    role,
    department: department || null,
    company_name: company_name || null,
  })
  if (e2) throw createError({ statusCode: 400, statusMessage: e2.message })

  return { ok: true, id: created.user.id, email, role }
})
