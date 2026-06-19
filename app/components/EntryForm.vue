<script setup lang="ts">
// Create / edit a daily entry. Used by the student only.
const props = defineProps<{ entry?: any | null }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const client = useSupabaseClient<any>()
const user = useSupabaseUser()

const today = new Date().toISOString().slice(0, 10)
const form = reactive({
  entry_date: props.entry?.entry_date ?? today,
  week_number: props.entry?.week_number ?? null,
  content: props.entry?.content ?? '',
  status: props.entry?.status ?? 'draft',
  media_url: props.entry?.media_url ?? null,
})
const file = ref<File | null>(null)
const error = ref('')
const saving = ref(false)

// The weekday for the chosen date (Monday, Tuesday, …).
const weekday = computed(() =>
  form.entry_date
    ? new Date(form.entry_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })
    : ''
)

function pickFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  file.value = f ?? null
}

async function uploadIfNeeded(): Promise<string | null> {
  if (!file.value) return form.media_url
  // Upload via the server route (service-role) so it doesn't depend on the
  // browser attaching the auth token.
  const fd = new FormData()
  fd.append('file', file.value)
  const res = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
  return res.url
}

async function save() {
  error.value = ''
  if (!form.entry_date || !form.content.trim()) {
    error.value = 'Date and the work done are required.'
    return
  }
  saving.value = true
  try {
    const media_url = await uploadIfNeeded()
    const payload = {
      entry_date: form.entry_date,
      week_number: form.week_number ? Number(form.week_number) : null,
      content: form.content.trim(),
      status: form.status,
      media_url,
    }
    let e
    if (props.entry?.id) {
      ;({ error: e } = await client.from('entries').update(payload).eq('id', props.entry.id))
    } else {
      ;({ error: e } = await client
        .from('entries')
        .insert({ ...payload, student_id: user.value!.id }))
    }
    if (e) throw e
    emit('saved')
  } catch (err: any) {
    error.value = err.message ?? 'Could not save.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="save">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="sm:col-span-2">
        <label class="label">
          Date
          <span v-if="weekday" class="ml-1 font-normal text-caleb-cyan-dark">· {{ weekday }}</span>
        </label>
        <input v-model="form.entry_date" type="date" class="field" />
      </div>
      <div>
        <label class="label">Week #</label>
        <input v-model="form.week_number" type="number" min="1" class="field" />
      </div>
    </div>

    <div>
      <label class="label">Work done today</label>
      <textarea
        v-model="form.content"
        rows="6"
        class="field logbook-lines"
        placeholder="Describe the tasks you carried out…"
      />
    </div>

    <div>
      <label class="label">Diagram / image (optional)</label>
      <input type="file" accept="image/*" class="field" @change="pickFile" />
      <div v-if="form.media_url && !file" class="mt-2">
        <img :src="form.media_url" class="max-h-40 rounded-lg border" alt="attachment" />
      </div>
    </div>

    <div>
      <label class="label">Status</label>
      <select v-model="form.status" class="field">
        <option value="draft">Draft (keep working)</option>
        <option value="submitted">Submit for approval</option>
      </select>
    </div>

    <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>

    <div class="flex gap-3">
      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save entry' }}
      </button>
      <button type="button" class="btn-outline" :disabled="saving" @click="emit('cancel')">
        Cancel
      </button>
    </div>
  </form>
</template>
