<script setup lang="ts">
// Week-based logbook: the student fills Monday–Friday for the active week; the
// next week unlocks only when all 5 days are written. Weeks are anchored to the
// admin-set SIWES start date.
const client = useSupabaseClient<any>()
const uid = useUid()

const startStr = ref<string | null>(null) // cohort-wide SIWES start date
const entries = ref<any[]>([])
const signoffs = ref<any[]>([])
const summaries = ref<any[]>([])
const loading = ref(true)
const selectedIdx = ref(0)
const savingDate = ref<string | null>(null)
const savingSummary = ref<number | null>(null)

const drafts = reactive<Record<string, string>>({})
const files = reactive<Record<string, File | null>>({})
const summaryDrafts = reactive<Record<number, string>>({}) // keyed by period 1..6
const summaryStatus = reactive<Record<number, string>>({})

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
const months = computed(() => buildMonths(startStr.value, weeks.value))
const summaryByPeriod = computed<Record<number, any>>(() => {
  const m: Record<number, any> = {}
  for (const s of summaries.value) if (s.period) m[s.period] = s
  return m
})

// The monthly summary shown under the current week: only the last week of each
// 4-week block (weeks 4, 8, 12, 16, 20, 24) carries one.
const currentMonth = computed(() => {
  const w = selectedWeek.value
  if (!w || w.week_number % WEEKS_PER_MONTH !== 0) return null
  return months.value[w.week_number / WEEKS_PER_MONTH - 1] ?? null
})
const currentMonthComplete = computed(() =>
  currentMonth.value ? monthComplete(currentMonth.value, entriesByDate.value) : false
)

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
  const mo = currentMonth.value
  if (mo) {
    const existing = summaryByPeriod.value[mo.period]
    summaryDrafts[mo.period] = existing?.content ?? ''
    summaryStatus[mo.period] = existing?.status ?? 'draft'
  }
}

async function load() {
  loading.value = true
  const [start, e, s, sm] = await Promise.all([
    getSiwesStart(),
    client.from('entries').select('*').eq('student_id', uid.value!),
    client.from('signoffs').select('*').eq('student_id', uid.value!),
    client.from('summaries').select('*').eq('student_id', uid.value!),
  ])
  startStr.value = start
  entries.value = e.data ?? []
  signoffs.value = s.data ?? []
  summaries.value = sm.data ?? []
  loading.value = false
  await nextTick()
  selectedIdx.value = activeIdx.value
  seedSelected()
}

async function saveSummary(mo: any) {
  const content = (summaryDrafts[mo.period] ?? '').trim()
  if (!content) {
    alert('Write your monthly summary first.')
    return
  }
  savingSummary.value = mo.period
  try {
    const d = new Date(mo.start + 'T00:00:00')
    const payload = {
      content,
      status: summaryStatus[mo.period] || 'draft',
      period: mo.period,
      month: d.getMonth() + 1, // kept only as a human-readable fallback
      year: d.getFullYear(),
    }
    const existing = summaryByPeriod.value[mo.period]
    const { error } = existing
      ? await client.from('summaries').update(payload).eq('id', existing.id)
      : await client.from('summaries').insert({ ...payload, student_id: uid.value! })
    if (error) throw error
    await load()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Could not save summary')
  } finally {
    savingSummary.value = null
  }
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
        student_id: uid.value!,
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

        <!-- Week sign-off pane (read-only). Always shown so the student can see
             the status; the signature comes from the work supervisor's link. -->
        <div class="border-t border-gray-200 p-4" :class="signoffByWeek[selectedWeek.week_number] ? 'bg-green-50' : 'bg-gray-50'">
          <p class="text-sm font-semibold" :class="signoffByWeek[selectedWeek.week_number] ? 'text-green-800' : 'text-gray-600'">
            Work supervisor sign-off
          </p>
          <template v-if="signoffByWeek[selectedWeek.week_number]">
            <p class="mt-0.5 text-xs text-gray-500">
              {{ signoffByWeek[selectedWeek.week_number].signer_name }}
              ({{ signoffByWeek[selectedWeek.week_number].signer_role }})
              · {{ fmt(signoffByWeek[selectedWeek.week_number].signed_at.slice(0, 10)) }}
            </p>
            <p v-if="signoffByWeek[selectedWeek.week_number].comment" class="mt-1 text-sm text-gray-700">
              "{{ signoffByWeek[selectedWeek.week_number].comment }}"
            </p>
            <img :src="signoffByWeek[selectedWeek.week_number].signature" class="mt-2 h-16 rounded border bg-white" alt="signature" />
          </template>
          <p v-else class="mt-1 text-sm text-gray-500">
            Awaiting sign-off — send your work supervisor the sign-off link once this week is complete.
          </p>
        </div>
      </div>

      <!-- Monthly summary — appears in place after each 4-week block -->
      <section v-if="currentMonth" class="card mt-4 overflow-hidden border-2 border-caleb-cyan-dark">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b border-caleb-cyan-dark/30 bg-caleb-cyan-dark/10 px-4 py-3">
          <div>
            <h2 class="font-semibold text-caleb-navy">Month {{ currentMonth.period }} Summary</h2>
            <p class="text-xs text-gray-500">
              Weeks {{ currentMonth.week_from }}–{{ currentMonth.week_to }} · {{ fmt(currentMonth.start) }} – {{ fmt(currentMonth.end) }}
            </p>
          </div>
          <StatusPill v-if="summaryByPeriod[currentMonth.period]" :status="summaryByPeriod[currentMonth.period].status" />
        </header>

        <div class="p-4">
          <div v-if="!currentMonthComplete" class="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-500">
            Complete all four weeks (Weeks {{ currentMonth.week_from }}–{{ currentMonth.week_to }}) to write your Month {{ currentMonth.period }} summary.
          </div>

          <template v-else>
            <p class="mb-2 text-sm text-gray-500">Summarise what you learned and did across these four weeks.</p>
            <textarea
              v-model="summaryDrafts[currentMonth.period]"
              rows="6"
              class="field logbook-lines"
              placeholder="Your monthly summary…"
            />
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <select v-model="summaryStatus[currentMonth.period]" class="field max-w-[12rem]">
                <option value="draft">Draft</option>
                <option value="submitted">Submit for approval</option>
              </select>
              <button class="btn-primary" :disabled="savingSummary === currentMonth.period" @click="saveSummary(currentMonth)">
                {{ savingSummary === currentMonth.period ? 'Saving…' : summaryByPeriod[currentMonth.period] ? 'Update summary' : 'Save summary' }}
              </button>
            </div>

            <!-- Supervisor comments / approval on the summary -->
            <div v-if="summaryByPeriod[currentMonth.period]" class="mt-3">
              <EntryFeedback :summary-id="summaryByPeriod[currentMonth.period].id" />
            </div>
          </template>
        </div>
      </section>

      <p class="mt-3 text-xs text-gray-400">
        Fill in all five days to unlock the next week. A monthly summary appears after every 4 weeks.
      </p>
    </template>
  </div>
</template>
