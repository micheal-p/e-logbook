<script setup lang="ts">
// Public-facing layout for the homepage, About, and SIWES pages.
const user = useSupabaseUser()
const { profile, load } = useProfile()
const open = ref(false)

const dashboardLink = ref('/login')
onMounted(async () => {
  if (user.value) {
    await load()
    dashboardLink.value = ROLE_HOME[profile.value?.role ?? ''] ?? '/login'
  }
})

const nav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Caleb' },
  { to: '/siwes', label: 'About SIWES' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <!-- Utility strip -->
    <div class="bg-caleb-navy text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs">
        <span class="hidden sm:inline">KM 15, Ikorodu-Itoikin Road, Imota, Lagos · For God and Humanity</span>
        <span class="sm:hidden">For God and Humanity</span>
        <span class="font-medium text-caleb-cyan">SIWES E-Logbook</span>
      </div>
    </div>

    <!-- Main header -->
    <header class="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <AppLogo :size="44" />

        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            v-for="l in nav"
            :key="l.to"
            :to="l.to"
            class="rounded-lg px-3 py-2 text-sm font-medium text-caleb-navy hover:bg-caleb-surface"
            exact-active-class="text-caleb-cyan-dark"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <NuxtLink v-if="user" :to="dashboardLink" class="btn-primary">My Dashboard</NuxtLink>
          <template v-else>
            <NuxtLink to="/login" class="btn-outline hidden sm:inline-flex">Sign in</NuxtLink>
            <NuxtLink to="/signup" class="btn-primary">Student Sign up</NuxtLink>
          </template>
          <button class="rounded-lg border border-gray-300 p-2 md:hidden" aria-label="Menu" @click="open = !open">
            <svg class="h-5 w-5 text-caleb-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      <!-- Mobile nav -->
      <nav v-if="open" class="border-t border-gray-100 bg-white md:hidden">
        <ul class="mx-auto max-w-6xl px-4 py-2">
          <li v-for="l in nav" :key="l.to">
            <NuxtLink
              :to="l.to"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-caleb-navy hover:bg-caleb-surface"
              @click="open = false"
            >
              {{ l.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mt-16 bg-caleb-navy text-white">
      <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <AppLogo :size="40" :with-text="false" />
          <p class="mt-3 text-sm text-gray-300">
            Caleb University, Imota, Lagos. Africa's Best Private University in Research and
            Entrepreneurship Development.
          </p>
        </div>
        <div>
          <h4 class="mb-3 font-semibold text-caleb-cyan">Quick links</h4>
          <ul class="space-y-1 text-sm text-gray-300">
            <li><NuxtLink to="/" class="hover:text-white">Home</NuxtLink></li>
            <li><NuxtLink to="/about" class="hover:text-white">About Caleb</NuxtLink></li>
            <li><NuxtLink to="/siwes" class="hover:text-white">About SIWES</NuxtLink></li>
            <li><NuxtLink to="/login" class="hover:text-white">Sign in</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h4 class="mb-3 font-semibold text-caleb-cyan">Contact</h4>
          <ul class="space-y-1 text-sm text-gray-300">
            <li>KM 15, Ikorodu-Itoikin Road, Imota, Lagos</li>
            <li>P.M.B. 21238, Ikeja</li>
            <li>0201-2910684, 0201-2910685</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        © Copyright 2026 Caleb University, Lagos. SIWES E-Logbook.
      </div>
    </footer>
  </div>
</template>
