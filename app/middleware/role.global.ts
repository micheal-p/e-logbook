// Role-based routing. Runs after @nuxtjs/supabase's own auth-redirect
// middleware (which bounces logged-out users to /login). Here we:
//  1. send a logged-in user landing on an auth page to their dashboard, and
//  2. stop any role from entering another role's area by typing the URL.
//
// NOTE: this is convenience/UX only. The real protection is Supabase RLS.
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  if (!user.value) return // not logged in -> supabase module handles it

  const { profile, load } = useProfile()
  if (!profile.value || profile.value.id !== user.value.id) await load()
  const role = profile.value?.role
  if (!role) return

  const home = ROLE_HOME[role] ?? '/'

  // Logged in but sitting on an auth page -> go home. (Public marketing pages
  // '/', '/about', '/siwes' stay viewable while logged in.)
  const authPages = ['/login', '/signup', '/reset-password']
  if (authPages.includes(to.path)) {
    return navigateTo(home)
  }

  // Area boundaries: only allow the role into its own prefix.
  const areas = Object.values(ROLE_HOME)
  const area = areas.find((p) => to.path === p || to.path.startsWith(p + '/'))
  if (area && area !== home) {
    return navigateTo(home)
  }
})
