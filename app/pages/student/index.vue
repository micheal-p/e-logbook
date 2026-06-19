<script setup lang="ts">
const client = useSupabaseClient<any>()
const user = useSupabaseUser()

const entries = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const editing = ref<any | null>(null)

async function load() {
  loading.value = true
  const { data } = await client
    .from('entries')
    .select('*')
    .eq('student_id', user.value!.id)
    .order('entry_date', { ascending: false })
  entries.value = data ?? []
  loading.value = false
}

function newEntry() {
  editing.value = null
  showForm.value = true
}
function edit(entry: any) {
  editing.value = entry
  showForm.value = true
}
async function remove(entry: any) {
  if (!confirm('Delete this entry? This cannot be undone.')) return
  const { error } = await client.from('entries').delete().eq('id', entry.id)
  if (error) return alert(error.message)
  await load()
}
async function onSaved() {
  showForm.value = false
  editing.value = null
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-caleb-text">My Logbook</h1>
        <p class="text-sm text-gray-500">Your daily SIWES task entries.</p>
      </div>
      <button v-if="!showForm" class="btn-primary" @click="newEntry">+ New entry</button>
    </div>

    <!-- Create / edit -->
    <div v-if="showForm" class="card mb-6 p-4 sm:p-6">
      <h2 class="mb-4 font-semibold">{{ editing ? 'Edit entry' : 'New entry' }}</h2>
      <EntryForm :entry="editing" @saved="onSaved" @cancel="showForm = false" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading entries…</div>

    <!-- Empty -->
    <div v-else-if="!entries.length" class="card p-10 text-center">
      <p class="text-gray-500">No entries yet.</p>
      <button class="btn-primary mt-4" @click="newEntry">Write your first entry</button>
    </div>

    <!-- List -->
    <div v-else class="space-y-6">
      <EntryCard
        v-for="e in entries"
        :key="e.id"
        :entry="e"
        :can-edit="true"
        @edit="edit"
        @delete="remove"
      />
    </div>
  </div>
</template>
