<script setup lang="ts">
definePageMeta({ layout: 'auth' })
const client = useSupabaseClient()

const form = reactive({
  full_name: '',
  matric_no: '',
  department: '',
  company_name: '',
  email: '',
  password: '',
})
const error = ref('')
const done = ref(false)
const loading = ref(false)

async function signup() {
  error.value = ''
  if (!form.full_name || !form.email || !form.password) {
    error.value = 'Name, email and password are required.'
    return
  }
  if (form.password.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  loading.value = true
  // The handle_new_user DB trigger reads this metadata into the profiles row
  // and sets role = 'student'.
  const { data, error: e } = await client.auth.signUp({
    email: form.email.trim(),
    password: form.password,
    options: {
      emailRedirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}/confirm` : undefined,
      data: {
        full_name: form.full_name.trim(),
        matric_no: form.matric_no.trim(),
        department: form.department.trim(),
        company_name: form.company_name.trim(),
      },
    },
  })
  loading.value = false
  if (e) {
    error.value = e.message
    return
  }
  // If email confirmation is on, there is no session yet.
  if (data.session) {
    const { load } = useProfile()
    const profile = await load(true)
    await navigateTo(ROLE_HOME[profile?.role ?? 'student'] ?? '/student')
  } else {
    done.value = true
  }
}
</script>

<template>
  <div>
    <template v-if="done">
      <h1 class="mb-2 text-xl font-bold text-caleb-navy">Check your email</h1>
      <p class="text-sm text-gray-600">
        We sent a confirmation link to <strong>{{ form.email }}</strong>. Click it to activate
        your account, then sign in.
      </p>
      <NuxtLink to="/login" class="btn-primary mt-6 w-full">Back to sign in</NuxtLink>
    </template>

    <template v-else>
      <h1 class="mb-1 text-xl font-bold text-caleb-text">Create student account</h1>
      <p class="mb-6 text-sm text-gray-500">
        Students self-register here. Supervisors and admins are set up by the school.
      </p>

      <form class="space-y-4" @submit.prevent="signup">
        <div>
          <label class="label">Full name</label>
          <input v-model="form.full_name" class="field" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Matric number</label>
            <input v-model="form.matric_no" class="field" />
          </div>
          <div>
            <label class="label">Department</label>
            <input v-model="form.department" class="field" />
          </div>
        </div>
        <div>
          <label class="label">Company / placement name</label>
          <input v-model="form.company_name" class="field" />
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="form.email" type="email" class="field" autocomplete="email" />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="form.password" type="password" class="field" autocomplete="new-password" />
        </div>

        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="mt-5 text-center text-sm">
        Already have an account?
        <NuxtLink to="/login" class="text-caleb-cyan-dark hover:underline">Sign in</NuxtLink>
      </p>
    </template>
  </div>
</template>
