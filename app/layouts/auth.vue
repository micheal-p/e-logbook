<script setup lang="ts">
const uid = useUid()
const { profile, load } = useProfile()
await load() // populate the role when signed in (e.g. changing password)

// Where the close (X) goes: signed-in users (changing their password) return to
// their dashboard; the public sign-in / sign-up / reset flows go to the landing page.
const backTo = computed(() =>
  uid.value && profile.value ? ROLE_HOME[profile.value.role] ?? '/' : '/'
)
const backLabel = computed(() => (backTo.value === '/' ? 'Back to home' : 'Back to dashboard'))
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center bg-caleb-surface px-4 py-10">
    <!-- Close → landing page when signed out, dashboard when signed in -->
    <NuxtLink
      :to="backTo"
      :aria-label="backLabel"
      :title="backLabel"
      class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-caleb-navy sm:right-6 sm:top-6"
    >
      <AppIcon name="close" :size="20" :stroke="2" />
    </NuxtLink>

    <div class="mb-6">
      <AppLogo :size="56" :with-text="false" />
    </div>
    <div class="card w-full max-w-md p-6 sm:p-8">
      <slot />
    </div>
    <p class="mt-6 text-center text-xs text-gray-400">
      Caleb University — SIWES Electronic Logbook
    </p>
  </div>
</template>
