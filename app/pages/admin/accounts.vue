<script setup lang="ts">
const client = useSupabaseClient<any>()

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  role: 'supervisor',
  department: '',
  company_name: '',
})
const creating = ref(false)
const error = ref('')
const created = ref<{ email: string; password: string; role: string } | null>(null)
const supervisors = ref<any[]>([])

const ROLE_CHOICES = [
  { value: 'supervisor', label: 'Academic Supervisor (lecturer)' },
  { value: 'company_supervisor', label: 'Company Supervisor' },
]

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let p = ''
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  for (const n of arr) p += chars[n % chars.length]
  form.password = p
}

async function loadSupervisors() {
  const { data } = await client
    .from('profiles')
    .select('full_name, email, role, department')
    .in('role', ['supervisor', 'company_supervisor'])
    .order('created_at', { ascending: false })
  supervisors.value = data ?? []
}

async function submit() {
  error.value = ''
  created.value = null
  if (!form.full_name || !form.email || form.password.length < 6) {
    error.value = 'Name, email and a password of at least 6 characters are required.'
    return
  }
  creating.value = true
  try {
    await $fetch('/api/admin/create-user', { method: 'POST', body: { ...form } })
    created.value = { email: form.email, password: form.password, role: form.role }
    Object.assign(form, { full_name: '', email: '', password: '', role: 'supervisor', department: '', company_name: '' })
    await loadSupervisors()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Could not create account.'
  } finally {
    creating.value = false
  }
}

onMounted(loadSupervisors)
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">Create Accounts</h1>
    <p class="mb-6 text-sm text-gray-500">
      Create login accounts for lecturers (academic supervisors) and company supervisors. Give them
      the email and password — they can change the password after first sign-in.
    </p>

    <!-- Success card with credentials to hand over -->
    <div v-if="created" class="card mb-6 border-l-4 border-caleb-green p-4">
      <p class="font-semibold text-caleb-navy">Account created ✓</p>
      <p class="mt-1 text-sm text-gray-600">Share these details with the supervisor:</p>
      <div class="mt-2 rounded-lg bg-caleb-surface p-3 text-sm">
        <p><span class="text-gray-500">Email:</span> <strong>{{ created.email }}</strong></p>
        <p><span class="text-gray-500">Password:</span> <strong>{{ created.password }}</strong></p>
      </div>
    </div>

    <div class="card mb-8 p-4 sm:p-6">
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Full name</label>
          <input v-model="form.full_name" class="field" />
        </div>
        <div>
          <label class="label">Role</label>
          <select v-model="form.role" class="field">
            <option v-for="r in ROLE_CHOICES" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-if="form.role === 'supervisor'">
            <label class="label">Department (optional)</label>
            <input v-model="form.department" class="field" />
          </div>
          <div v-if="form.role === 'company_supervisor'">
            <label class="label">Company (optional)</label>
            <input v-model="form.company_name" class="field" />
          </div>
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="form.email" type="email" class="field" autocomplete="off" />
        </div>
        <div>
          <label class="label">Temporary password</label>
          <div class="flex gap-2">
            <input v-model="form.password" class="field" autocomplete="off" />
            <button type="button" class="btn-outline whitespace-nowrap" @click="generatePassword">
              Generate
            </button>
          </div>
        </div>

        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="creating">
          {{ creating ? 'Creating…' : 'Create account' }}
        </button>
      </form>
    </div>

    <h2 class="mb-3 text-lg font-semibold">Existing supervisors</h2>
    <div v-if="!supervisors.length" class="card p-10 text-center text-gray-500">
      No supervisor accounts yet.
    </div>
    <div v-else class="card overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-caleb-surface text-left text-xs uppercase text-gray-500">
          <tr>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Email</th>
            <th class="px-4 py-2">Role</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="s in supervisors" :key="s.email">
            <td class="px-4 py-2 font-medium">{{ s.full_name || '—' }}</td>
            <td class="px-4 py-2">{{ s.email }}</td>
            <td class="px-4 py-2">{{ ROLE_LABELS[s.role] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
