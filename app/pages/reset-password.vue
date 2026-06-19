<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const client = useSupabaseClient()

const email = ref('')
const sent = ref(false)
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!email.value) {
    error.value = 'Enter your email.'
    return
  }
  loading.value = true
  const { error: e } = await client.auth.resetPasswordForEmail(email.value.trim(), {
    redirectTo:
      typeof window !== 'undefined' ? `${window.location.origin}/update-password` : undefined,
  })
  loading.value = false
  if (e) {
    error.value = e.message
    return
  }
  sent.value = true
}
</script>

<template>
  <div>
    <template v-if="sent">
      <h1 class="mb-2 text-xl font-bold text-caleb-navy">Email sent</h1>
      <p class="text-sm text-gray-600">
        If an account exists for <strong>{{ email }}</strong>, a password-reset link is on its way.
      </p>
      <NuxtLink to="/login" class="btn-primary mt-6 w-full">Back to sign in</NuxtLink>
    </template>

    <template v-else>
      <h1 class="mb-1 text-xl font-bold text-caleb-text">Reset password</h1>
      <p class="mb-6 text-sm text-gray-500">We'll email you a link to set a new password.</p>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" class="field" autocomplete="email" />
        </div>
        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>
      <p class="mt-5 text-center text-sm">
        <NuxtLink to="/login" class="text-caleb-cyan-dark hover:underline">Back to sign in</NuxtLink>
      </p>
    </template>
  </div>
</template>
