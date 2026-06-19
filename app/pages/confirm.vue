<script setup lang="ts">
// @nuxtjs/supabase redirects here after email confirmation / OAuth. Once the
// session is set, send the user to their dashboard.
definePageMeta({ layout: 'auth' })
const user = useSupabaseUser()

watch(
  user,
  async (u) => {
    if (u) {
      const { load } = useProfile()
      const profile = await load(true)
      await navigateTo(ROLE_HOME[profile?.role ?? 'student'] ?? '/student')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="text-center">
    <p class="text-sm text-gray-500">Confirming your account…</p>
  </div>
</template>
