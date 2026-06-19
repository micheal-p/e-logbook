<script setup lang="ts">
// Landing page for the password-reset email link. The link carries a one-time
// code; we exchange it for a session, then let the user set a new password.
definePageMeta({ layout: 'auth' })
const client = useSupabaseClient()
const route = useRoute()
const user = useSupabaseUser()
const { profile, load } = useProfile()

// Where to send the user once the password is set: their dashboard if they're
// already signed in (changing password), else the sign-in page (reset flow).
const nextLink = ref('/login')
const nextLabel = ref('Go to sign in')

const password = ref('')
const confirm = ref('')
const error = ref('')
const done = ref(false)
const loading = ref(false)

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (code) {
    const { error: e } = await client.auth.exchangeCodeForSession(code)
    if (e) error.value = e.message
  }
})

async function submit() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  const { error: e } = await client.auth.updateUser({ password: password.value })
  loading.value = false
  if (e) {
    error.value = e.message
    return
  }
  // If they were already signed in, send them back to their dashboard.
  if (user.value) {
    const p = await load(true)
    nextLink.value = ROLE_HOME[p?.role ?? 'student'] ?? '/student'
    nextLabel.value = 'Back to my dashboard'
  }
  done.value = true
}
</script>

<template>
  <div>
    <template v-if="done">
      <h1 class="mb-2 text-xl font-bold text-caleb-navy">Password updated</h1>
      <p class="text-sm text-gray-600">Your password has been changed.</p>
      <NuxtLink :to="nextLink" class="btn-primary mt-6 w-full">{{ nextLabel }}</NuxtLink>
    </template>

    <template v-else>
      <h1 class="mb-1 text-xl font-bold text-caleb-text">Set a new password</h1>
      <p class="mb-6 text-sm text-gray-500">Choose a new password for your account.</p>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">New password</label>
          <input v-model="password" type="password" class="field" autocomplete="new-password" />
        </div>
        <div>
          <label class="label">Confirm password</label>
          <input v-model="confirm" type="password" class="field" autocomplete="new-password" />
        </div>
        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Saving…' : 'Update password' }}
        </button>
      </form>
    </template>
  </div>
</template>
