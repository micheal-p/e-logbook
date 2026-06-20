<script setup lang="ts">
const client = useSupabaseClient<any>()

const profiles = ref<any[]>([])
const assignments = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const supervisorFilter = ref('') // '', 'unassigned', or an academic supervisor id
const savingId = ref('')
const savedId = ref('')

// Editable row state per student, seeded from existing assignments.
const rows = reactive<Record<string, { supervisor_id: string; company_supervisor_id: string }>>({})

const students = computed(() => profiles.value.filter((p) => p.role === 'student'))
const academics = computed(() => profiles.value.filter((p) => p.role === 'supervisor'))
const companies = computed(() => profiles.value.filter((p) => p.role === 'company_supervisor'))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  let list = students.value
  if (supervisorFilter.value === 'unassigned') {
    list = list.filter((s) => !assignmentFor(s.id)?.supervisor_id)
  } else if (supervisorFilter.value) {
    list = list.filter((s) => assignmentFor(s.id)?.supervisor_id === supervisorFilter.value)
  }
  if (q) {
    list = list.filter(
      (s) =>
        (s.matric_no || '').toLowerCase().includes(q) ||
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    )
  }
  return list
})

function assignmentFor(id: string) {
  return assignments.value.find((a) => a.student_id === id)
}
function profileName(id: string | null | undefined) {
  if (!id) return null
  const p = profiles.value.find((x) => x.id === id)
  return p ? p.full_name || p.email : null
}
function rowFor(id: string) {
  if (!rows[id]) {
    const a = assignmentFor(id)
    rows[id] = {
      supervisor_id: a?.supervisor_id || '',
      company_supervisor_id: a?.company_supervisor_id || '',
    }
  }
  return rows[id]
}

async function load() {
  loading.value = true
  const [p, a] = await Promise.all([
    client.from('profiles').select('*').order('full_name'),
    client.from('assignments').select('*'),
  ])
  profiles.value = p.data ?? []
  assignments.value = a.data ?? []
  for (const k of Object.keys(rows)) delete rows[k]
  loading.value = false
}

async function save(s: any) {
  const r = rowFor(s.id)
  savingId.value = s.id
  savedId.value = ''
  const { error } = await client.from('assignments').upsert(
    {
      student_id: s.id,
      supervisor_id: r.supervisor_id || null,
      company_supervisor_id: r.company_supervisor_id || null,
    },
    { onConflict: 'student_id' }
  )
  savingId.value = ''
  if (error) return alert(error.message)
  savedId.value = s.id
  setTimeout(() => savedId.value === s.id && (savedId.value = ''), 1500)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">Assign Students</h1>
    <p class="mb-4 text-sm text-gray-500">
      Set each student's academic (lecturer) and company supervisor. Filter by a lecturer to see who is
      under them. The SIWES start date is set once for everyone on the Overview page.
    </p>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <template v-else>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="sm:max-w-sm sm:flex-1">
          <label class="label">Search</label>
          <input v-model="search" class="field" placeholder="Matric number, name or email…" />
        </div>
        <div class="sm:max-w-xs sm:flex-1">
          <label class="label">Filter by academic supervisor</label>
          <select v-model="supervisorFilter" class="field">
            <option value="">All students</option>
            <option value="unassigned">Unassigned (no lecturer)</option>
            <option v-for="a in academics" :key="a.id" :value="a.id">{{ a.full_name || a.email }}</option>
          </select>
        </div>
      </div>

      <p class="mb-3 text-xs text-gray-400">
        Showing {{ filtered.length }} student{{ filtered.length === 1 ? '' : 's' }}.
      </p>

      <p v-if="!academics.length && !companies.length" class="mb-4 text-sm text-amber-600">
        No supervisors yet — create them on the <NuxtLink to="/admin/accounts" class="underline">Create Accounts</NuxtLink> page first.
      </p>

      <div v-if="!filtered.length" class="card p-10 text-center text-gray-500">No matching students.</div>

      <div v-else class="space-y-3">
        <div v-for="s in filtered" :key="s.id" class="card p-4">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="font-semibold text-caleb-navy">{{ s.full_name || s.email }}</p>
              <p class="text-xs text-gray-500">{{ s.matric_no || 'no matric' }} · {{ s.department || '—' }}</p>
              <p class="mt-1 text-xs text-gray-400">
                Academic: <span class="text-gray-600">{{ profileName(assignmentFor(s.id)?.supervisor_id) || 'none' }}</span>
                · Company: <span class="text-gray-600">{{ profileName(assignmentFor(s.id)?.company_supervisor_id) || 'none' }}</span>
              </p>
            </div>
            <span v-if="!assignmentFor(s.id)?.supervisor_id" class="pill bg-amber-100 text-amber-800">Unassigned</span>
            <span v-else class="pill bg-green-100 text-green-800">Assigned</span>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="label">Academic supervisor</label>
              <select v-model="rowFor(s.id).supervisor_id" class="field">
                <option value="">— none —</option>
                <option v-for="a in academics" :key="a.id" :value="a.id">{{ a.full_name || a.email }}</option>
              </select>
            </div>
            <div>
              <label class="label">Company supervisor</label>
              <select v-model="rowFor(s.id).company_supervisor_id" class="field">
                <option value="">— none —</option>
                <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.full_name || c.email }}</option>
              </select>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-3">
            <button class="btn-primary" :disabled="savingId === s.id" @click="save(s)">
              {{ savingId === s.id ? 'Saving…' : 'Save' }}
            </button>
            <span v-if="savedId === s.id" class="inline-flex items-center gap-1 text-sm text-green-700"><AppIcon name="check" :size="14" :stroke="2.5" /> Saved</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
