<script setup lang="ts">
// Week-based logbook: the student fills Monday–Friday for the active week; the
// next week unlocks only when all 5 days are written. Weeks are anchored to the
// admin-set SIWES start date.
const client = useSupabaseClient<any>()
const user = useSupabaseUser()

const assignment = ref<any | null>(null)
const entries = ref<any[]>([])
const signoffs = ref<any[]>([])
const loading = ref(true)
const selectedIdx = ref(0)
const savingDate = ref<string | null>(null)

const drafts = reactive<Record<string, string>>({})
const files = reactive<Record<string, File | null>>({})

const startStr = computed(
  () => assignment.value?.start_date || assignment.value?.created_at?.slice(0, 10) || null
)
const entriesByDate = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const e of entries.value) m[e.entry_date] = e
  return m
})
const signoffByWeek = computed<Record<number, any>>(() => {
  const m: Record<number, any> = {}
  for (const s of signoffs.value) m[s.week_number] = s
  return m
})
const weeks = computed(() => buildWeeks(startStr.value))

// First incomplete week is the active one; everything after it is locked.
const activeIdx = computed(() => {
  for (let i = 0; i < weeks.value.length; i++) {
    if (!weekComplete(weeks.value[i], entriesByDate.value)) return i
  }
  return Math.max(0, weeks.value.length - 1)
})
const selectedWeek = computed(() => weeks.value[selectedIdx.value] ?? null)
const isUnlocked = (i: number) => i <= activeIdx.value

function seedSelected() {
  if (!selectedWeek.value) return
  for (const d of selectedWeek.value.days) {
    drafts[d.date] = entriesByDate.value[d.date]?.content ?? ''
  }
}

async function load() {
  loading.value = true
  const [a, e, s] = await Promise.all([
    client.from('assignments').select('start_date, created_at').eq('student_id', user.value!.id).maybeSingle(),
    client.from('entries').select('*').eq('student_id', user.value!.id),
    client.from('signoffs').select('*').eq('student_id', user.value!.id),
  ])
  assignment.value = a.data
  entries.value = e.data ?? []
  signoffs.value = s.data ?? []
  loading.value = false
  await nextTick()
  selectedIdx.value = activeIdx.value
  seedSelected()
}

function pickWeek(i: number) {
  if (!isUnlocked(i)) return
  selectedIdx.value = i
  seedSelected()
}

function onFile(date: string, e: Event) {
  files[date] = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function saveDay(day: any) {
  const content = (drafts[day.date] ?? '').trim()
  if (!content) {
    alert('Write the day’s work before saving.')
    return
  }
  savingDate.value = day.date
  try {
    let media_url = entriesByDate.value[day.date]?.media_url ?? null
    if (files[day.date]) {
      const fd = new FormData()
      fd.append('file', files[day.date]!)
      const r = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
      media_url = r.url
    }
    const existing = entriesByDate.value[day.date]
    if (existing) {
      const { error } = await client.from('entries').update({ content, media_url, status: 'submitted' }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await client.from('entries').insert({
        student_id: user.value!.id,
        entry_date: day.date,
        week_number: selectedWeek.value!.week_number,
        content,
        media_url,
        status: 'submitted',
      })
      if (error) throw error
    }
    files[day.date] = null
    await load()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Could not save')
  } finally {
    savingDate.value = null
  }
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading your logbook…</div>

    <!-- No schedule yet -->
    <div v-else-if="!startStr" class="card p-10 text-center">
      <p class="text-gray-600">Your SIWES hasn't been scheduled yet.</p>
      <p class="mt-1 text-sm text-gray-400">
        Once the admin allocates you and sets a start date, your weekly logbook will appear here.
      </p>
    </div>

    <template v-else>
      <!-- Week selector -->
      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="(w, i) in weeks"
          :key="w.week_number"
          class="h-9 w-9 rounded-lg text-sm font-medium"
          :class="[
            i === selectedIdx ? 'bg-caleb-navy text-white' : isUnlocked(i) ? 'bg-white text-caleb-navy border border-gray-300 hover:bg-caleb-surface' : 'cursor-not-allowed bg-gray-100 text-gray-300',
          ]"
          :disabled="!isUnlocked(i)"
          :title="isUnlocked(i) ? 'Week ' + w.week_number : 'Complete the current week to unlock'"
          @click="pickWeek(i)"
        >
          {{ w.week_number }}
        </button>
      </div>

      <div v-if="selectedWeek" class="card overflow-hidden">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-caleb-navy bg-caleb-surface px-4 py-3">
          <div>
            <h2 class="font-semibold text-caleb-navy">Week {{ selectedWeek.week_number }}</h2>
            <p class="text-xs text-gray-500">{{ fmt(selectedWeek.monday) }} – {{ fmt(selectedWeek.friday) }}</p>
          </div>
          <span v-if="signoffByWeek[selectedWeek.week_number]" class="pill bg-green-100 text-green-800">
            ✓ Signed by {{ signoffByWeek[selectedWeek.week_number].signer_name }}
          </span>
        </header>

        <!-- Days Mon–Fri -->
        <div class="divide-y divide-gray-100">
          <div v-for="day in selectedWeek.days" :key="day.date" class="p-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="font-semibold text-caleb-navy">
                {{ day.weekday }}
                <span class="ml-1 text-xs font-normal text-gray-500">{{ fmt(day.date) }}</span>
              </p>
              <StatusPill v-if="entriesByDate[day.date]" :status="entriesByDate[day.date].status" />
            </div>

            <textarea
              v-model="drafts[day.date]"
              rows="3"
              class="field logbook-lines"
              placeholder="What did you do on this day?"
            />

            <div class="mt-2 flex flex-wrap items-center gap-3">
              <input type="file" accept="image/*" class="text-sm" @change="(e) => onFile(day.date, e)" />
              <button class="btn-primary" :disabled="savingDate === day.date" @click="saveDay(day)">
                {{ savingDate === day.date ? 'Saving…' : entriesByDate[day.date] ? 'Update' : 'Save' }}
              </button>
            </div>

            <img v-if="entriesByDate[day.date]?.media_url" :src="entriesByDate[day.date].media_url" class="mt-2 max-h-40 rounded border" alt="attachment" />

            <!-- Supervisor comments / approvals -->
            <div v-if="entriesByDate[day.date]" class="mt-3">
              <EntryFeedback :entry-id="entriesByDate[day.date].id" />
            </div>
          </div>
        </div>

        <!-- Week sign-off (read-only, from the work supervisor link) -->
        <div v-if="signoffByWeek[selectedWeek.week_number]" class="border-t border-gray-200 bg-green-50 p-4">
          <p class="text-sm font-semibold text-green-800">
            Work supervisor sign-off — {{ signoffByWeek[selectedWeek.week_number].signer_name }}
            ({{ signoffByWeek[selectedWeek.week_number].signer_role }})
          </p>
          <p v-if="signoffByWeek[selectedWeek.week_number].comment" class="mt-1 text-sm text-gray-700">
            "{{ signoffByWeek[selectedWeek.week_number].comment }}"
          </p>
          <img :src="signoffByWeek[selectedWeek.week_number].signature" class="mt-2 h-16 rounded border bg-white" alt="signature" />
        </div>
      </div>

      <p class="mt-3 text-xs text-gray-400">
        Fill in all five days to unlock the next week. Completed weeks stay editable.
      </p>
    </template>
  </div>
</template>
