<script setup lang="ts">
const client = useSupabaseClient<any>()

const profiles = ref<any[]>([])
const assignments = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const msg = ref('')
const error = ref('')

const form = reactive({ student_id: '', supervisor_id: '', company_supervisor_id: '' })

const students = computed(() => profiles.value.filter((p) => p.role === 'student'))
const academics = computed(() => profiles.value.filter((p) => p.role === 'supervisor'))
const companies = computed(() => profiles.value.filter((p) => p.role === 'company_supervisor'))

async function load() {
  loading.value = true
  const [p, a] = await Promise.all([
    client.from('profiles').select('*').order('full_name'),
    client
      .from('assignments')
      .select(
        '*, student:profiles!assignments_student_id_fkey(full_name, matric_no), supervisor:profiles!assignments_supervisor_id_fkey(full_name), company:profiles!assignments_company_supervisor_id_fkey(full_name)'
      ),
  ])
  profiles.value = p.data ?? []
  assignments.value = a.data ?? []
  loading.value = false
}

// Pre-fill the form when editing an existing assignment.
function editRow(a: any) {
  form.student_id = a.student_id
  form.supervisor_id = a.supervisor_id ?? ''
  form.company_supervisor_id = a.company_supervisor_id ?? ''
  msg.value = ''
}

async function save() {
  error.value = ''
  msg.value = ''
  if (!form.student_id) {
    error.value = 'Pick a student.'
    return
  }
  saving.value = true
  // Unique(student_id) lets us upsert: one assignment row per student.
  const { error: e } = await client.from('assignments').upsert(
    {
      student_id: form.student_id,
      supervisor_id: form.supervisor_id || null,
      company_supervisor_id: form.company_supervisor_id || null,
    },
    { onConflict: 'student_id' }
  )
  saving.value = false
  if (e) {
    error.value = e.message
    return
  }
  msg.value = 'Assignment saved.'
  Object.assign(form, { student_id: '', supervisor_id: '', company_supervisor_id: '' })
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">Assign Students</h1>
    <p class="mb-6 text-sm text-gray-500">
      Give each student one academic supervisor and one company supervisor.
    </p>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <template v-else>
      <div class="card mb-8 p-4 sm:p-6">
        <form class="space-y-4" @submit.prevent="save">
          <div>
            <label class="label">Student</label>
            <select v-model="form.student_id" class="field">
              <option value="">— select student —</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.full_name || s.email }} <template v-if="s.matric_no">({{ s.matric_no }})</template>
              </option>
            </select>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="label">Academic supervisor</label>
              <select v-model="form.supervisor_id" class="field">
                <option value="">— none —</option>
                <option v-for="a in academics" :key="a.id" :value="a.id">{{ a.full_name || a.email }}</option>
              </select>
            </div>
            <div>
              <label class="label">Company supervisor</label>
              <select v-model="form.company_supervisor_id" class="field">
                <option value="">— none —</option>
                <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.full_name || c.email }}</option>
              </select>
            </div>
          </div>

          <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
          <p v-if="msg" class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{{ msg }}</p>

          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save assignment' }}
          </button>
        </form>
        <p v-if="!academics.length && !companies.length" class="mt-3 text-xs text-amber-600">
          No supervisors exist yet — promote some users to supervisor roles on the Overview page first.
        </p>
      </div>

      <h2 class="mb-3 text-lg font-semibold">Current assignments</h2>
      <div v-if="!assignments.length" class="card p-10 text-center text-gray-500">No assignments yet.</div>
      <div v-else class="card overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-caleb-surface text-left text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-2">Student</th>
              <th class="px-4 py-2">Academic Sup.</th>
              <th class="px-4 py-2">Company Sup.</th>
              <th class="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="a in assignments" :key="a.id">
              <td class="px-4 py-2 font-medium">{{ a.student?.full_name || '—' }}</td>
              <td class="px-4 py-2">{{ a.supervisor?.full_name || '—' }}</td>
              <td class="px-4 py-2">{{ a.company?.full_name || '—' }}</td>
              <td class="px-4 py-2">
                <button class="text-caleb-cyan-dark hover:underline" @click="editRow(a)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
