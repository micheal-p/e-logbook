<script setup lang="ts">
const client = useSupabaseClient<any>()
const uid = useUid()

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const summaries = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editing = ref<any | null>(null)
const now = new Date()
const form = reactive({ month: now.getMonth() + 1, year: now.getFullYear(), content: '', status: 'draft' })
const saving = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  const { data } = await client
    .from('summaries')
    .select('*')
    .eq('student_id', uid.value!)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  summaries.value = data ?? []
  loading.value = false
}

function openNew() {
  editing.value = null
  Object.assign(form, { month: now.getMonth() + 1, year: now.getFullYear(), content: '', status: 'draft' })
  showForm.value = true
}
function openEdit(s: any) {
  editing.value = s
  Object.assign(form, { month: s.month, year: s.year, content: s.content, status: s.status })
  showForm.value = true
}

async function save() {
  error.value = ''
  if (!form.content.trim()) {
    error.value = 'Write your summary first.'
    return
  }
  saving.value = true
  const payload = {
    month: Number(form.month),
    year: Number(form.year),
    content: form.content.trim(),
    status: form.status,
  }
  let e
  if (editing.value?.id) {
    ;({ error: e } = await client.from('summaries').update(payload).eq('id', editing.value.id))
  } else {
    ;({ error: e } = await client.from('summaries').insert({ ...payload, student_id: uid.value! }))
  }
  saving.value = false
  if (e) {
    error.value = e.message
    return
  }
  showForm.value = false
  await load()
}

async function remove(s: any) {
  if (!confirm('Delete this summary?')) return
  const { error: e } = await client.from('summaries').delete().eq('id', s.id)
  if (e) return alert(e.message)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-caleb-text">Monthly Summaries</h1>
        <p class="text-sm text-gray-500">A summary of each month of your placement.</p>
      </div>
      <button v-if="!showForm" class="btn-primary" @click="openNew">+ New summary</button>
    </div>

    <div v-if="showForm" class="card mb-6 p-4 sm:p-6">
      <h2 class="mb-4 font-semibold">{{ editing ? 'Edit summary' : 'New summary' }}</h2>
      <form class="space-y-4" @submit.prevent="save">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Month</label>
            <select v-model="form.month" class="field">
              <option v-for="(m, i) in MONTHS" :key="i" :value="i + 1">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="label">Year</label>
            <input v-model="form.year" type="number" class="field" />
          </div>
        </div>
        <div>
          <label class="label">Summary</label>
          <textarea v-model="form.content" rows="6" class="field logbook-lines" />
        </div>
        <div>
          <label class="label">Status</label>
          <select v-model="form.status" class="field">
            <option value="draft">Draft</option>
            <option value="submitted">Submit for approval</option>
          </select>
        </div>
        <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
        <div class="flex gap-3">
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save summary' }}
          </button>
          <button type="button" class="btn-outline" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <div v-else-if="!summaries.length" class="card p-10 text-center">
      <p class="text-gray-500">No summaries yet.</p>
      <button class="btn-primary mt-4" @click="openNew">Write your first summary</button>
    </div>

    <div v-else class="space-y-6">
      <article v-for="s in summaries" :key="s.id" class="card overflow-hidden">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-caleb-cyan-dark bg-caleb-surface px-4 py-3">
          <h3 class="font-semibold">{{ MONTHS[s.month - 1] }} {{ s.year }}</h3>
          <div class="flex items-center gap-2">
            <StatusPill :status="s.status" />
            <button class="text-sm text-caleb-cyan-dark hover:underline" @click="openEdit(s)">Edit</button>
            <button class="text-sm text-red-600 hover:underline" @click="remove(s)">Delete</button>
          </div>
        </header>
        <div class="space-y-4 px-4 py-4">
          <p class="logbook-lines whitespace-pre-wrap text-[15px]">{{ s.content }}</p>
          <EntryFeedback :summary-id="s.id" />
        </div>
      </article>
    </div>
  </div>
</template>
