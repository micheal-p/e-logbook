// The logged-in user's profile row (id, role, full_name, ...), cached in
// Nuxt state so we only hit the DB once per session unless we refresh.
export interface Profile {
  id: string
  full_name: string | null
  role: 'super_admin' | 'admin' | 'supervisor' | 'company_supervisor' | 'student'
  email: string | null
  matric_no: string | null
  department: string | null
  company_name: string | null
  avatar_url: string | null
  created_at: string
}

// The current user's id. @nuxtjs/supabase v2 stores JWT *claims* in
// useSupabaseUser(), where the user id is `sub` (not `id`).
export const currentUid = (): string | undefined => {
  const user = useSupabaseUser()
  return (user.value as any)?.sub ?? (user.value as any)?.id
}
export const useUid = () => computed<string | undefined>(() => currentUid())

export const useProfile = () => {
  const client = useSupabaseClient()
  const profile = useState<Profile | null>('profile', () => null)

  const load = async (force = false) => {
    const uid = currentUid()
    if (!uid) {
      profile.value = null
      return null
    }
    if (!force && profile.value && profile.value.id === uid) {
      return profile.value
    }
    const { data, error } = await client.from('profiles').select('*').eq('id', uid).single()
    if (!error) profile.value = data as Profile
    return profile.value
  }

  return { profile, load }
}

// Human-readable labels for each role.
export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin (IT)',
  admin: 'Admin (School Board)',
  supervisor: 'Academic Supervisor',
  company_supervisor: 'Company Supervisor',
  student: 'Student',
}

// Where each role lives. Company supervisors have no login area — they sign off
// weekly via the student's public share link — so they're intentionally absent.
export const ROLE_HOME: Record<string, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  supervisor: '/supervisor',
  student: '/student',
}
