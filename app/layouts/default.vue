<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const { profile, load } = useProfile()
const notifications = useNotifications()
const toast = useToast()
const open = ref(false) // mobile nav

await load()
// Reload the profile whenever the auth user settles/changes, so the header
// name + role-based nav appear even if the session hydrates after first render.
watch(user, () => load(true))

// Notifications: load the list and open a realtime channel once we have a user;
// each new row pops a toast. Tear down on sign-out.
function startNotifications() {
  if (!currentUid()) return
  notifications.load()
  notifications.subscribe((n) => toast.push({ title: n.title, body: n.body ?? undefined, link: n.link ?? undefined }))
}
onMounted(startNotifications)
watch(user, (u) => (u ? startNotifications() : notifications.unsubscribe()))
onBeforeUnmount(() => notifications.unsubscribe())

// Nav links per role.
const NAV: Record<string, { to: string; label: string }[]> = {
  student: [{ to: '/student', label: 'My Logbook' }],
  company_supervisor: [{ to: '/company', label: 'My Students' }],
  supervisor: [{ to: '/supervisor', label: 'My Students' }],
  admin: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/accounts', label: 'Create Accounts' },
    { to: '/admin/assign', label: 'Assign Students' },
  ],
  super_admin: [{ to: '/super-admin', label: 'Overview' }],
}
const links = computed(() => (profile.value ? NAV[profile.value.role] ?? [] : []))

async function signOut() {
  notifications.unsubscribe()
  notifications.items.value = []
  await client.auth.signOut()
  profile.value = null // clear cached role so the next sign-in starts fresh
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Top bar -->
    <header class="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <AppLogo :size="38" />

        <div class="flex items-center gap-3">
          <NotificationBell v-if="profile" />
          <div class="hidden text-right sm:block">
            <p class="text-sm font-semibold leading-tight">{{ profile?.full_name || 'User' }}</p>
            <p class="text-xs text-gray-500">{{ profile ? ROLE_LABELS[profile.role] : '' }}</p>
          </div>
          <NuxtLink to="/update-password" class="hidden text-sm text-caleb-cyan-dark hover:underline sm:inline">
            Change password
          </NuxtLink>
          <button class="btn-outline" @click="signOut">Sign out</button>
          <button
            class="rounded-lg border border-gray-300 p-2 sm:hidden"
            aria-label="Menu"
            @click="open = !open"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Nav: horizontal on desktop, collapsible on mobile -->
      <nav class="border-t border-gray-100 bg-caleb-surface">
        <div
          class="mx-auto max-w-6xl px-4"
          :class="open ? 'block' : 'hidden sm:block'"
        >
          <ul class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-2">
            <li v-for="l in links" :key="l.to">
              <NuxtLink
                :to="l.to"
                class="block rounded-lg px-3 py-2 text-sm font-medium text-caleb-text hover:bg-white"
                exact-active-class="bg-caleb-navy text-white hover:bg-caleb-navy"
                @click="open = false"
              >
                {{ l.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>

    <ToastHost />
  </div>
</template>
