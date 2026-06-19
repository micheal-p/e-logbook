<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const client = useSupabaseClient()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Enter your email and password.'
    return
  }
  loading.value = true
  const { data, error: e } = await client.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })
  loading.value = false
  if (e) {
    error.value = e.message
    return
  }
  // Read the role straight from the just-signed-in user (don't rely on cached
  // client state, which can lag a tick right after sign-in).
  const { data: prof } = await client
    .from('profiles')
    .select('role')
    .eq('id', data.user!.id)
    .single()
  const { load } = useProfile()
  await load(true)
  await navigateTo(ROLE_HOME[(prof as any)?.role ?? 'student'] ?? '/student')
}
</script>

<template>
  <div>
    <h1 class="mb-1 text-xl font-bold text-caleb-text">Sign in</h1>
    <p class="mb-6 text-sm text-gray-500">Welcome back to your e-logbook.</p>

    <form class="space-y-4" @submit.prevent="login">
      <div>
        <label class="label" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="field" autocomplete="email" />
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="field"
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <div class="mt-5 flex items-center justify-between text-sm">
      <NuxtLink to="/reset-password" class="text-caleb-cyan-dark hover:underline">Forgot password?</NuxtLink>
      <NuxtLink to="/signup" class="text-caleb-cyan-dark hover:underline">Create a student account</NuxtLink>
    </div>
  </div>
</template>
