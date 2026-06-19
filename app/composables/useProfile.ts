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

export const useProfile = () => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()
  const profile = useState<Profile | null>('profile', () => null)

  const load = async (force = false) => {
    if (!user.value) {
      profile.value = null
      return null
    }
    if (!force && profile.value && profile.value.id === user.value.id) {
      return profile.value
    }
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
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

// Where each role lives.
export const ROLE_HOME: Record<string, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  supervisor: '/supervisor',
  company_supervisor: '/company',
  student: '/student',
}
