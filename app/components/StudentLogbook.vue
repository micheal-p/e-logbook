<script setup lang="ts">
// Read-only view of one student's logbook, used by both supervisor roles and
// (read-only) by admin / super admin. `can` controls which feedback actions
// are offered on each entry/summary.
const props = withDefaults(
  defineProps<{
    studentId: string
    can?: { comment?: boolean; approve?: boolean }
    showSummaries?: boolean
  }>(),
  { can: () => ({}), showSummaries: true }
)

const client = useSupabaseClient<any>()
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const student = ref<any | null>(null)
const entries = ref<any[]>([])
const summaries = ref<any[]>([])
const loading = ref(true)
const tab = ref<'entries' | 'summaries'>('entries')

// Group entries into weeks (newest week first, newest day first within a week)
// so the supervisor approves a whole week in one action instead of day by day.
const weekGroups = computed(() => {
  const map = new Map<number, any[]>()
  for (const e of entries.value) {
    const wk = e.week_number ?? 0
    if (!map.has(wk)) map.set(wk, [])
    map.get(wk)!.push(e)
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([weekNumber, items]) => ({ weekNumber, entries: items }))
})

async function load() {
  loading.value = true
  const [p, e, s] = await Promise.all([
    client.from('profiles').select('*').eq('id', props.studentId).single(),
    client.from('entries').select('*').eq('student_id', props.studentId).order('entry_date', { ascending: false }),
    props.showSummaries
      ? client.from('summaries').select('*').eq('student_id', props.studentId).order('period', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] as any[] }),
  ])
  student.value = p.data
  entries.value = e.data ?? []
  summaries.value = s.data ?? []
  loading.value = false
}

// "Month N · Weeks a–b" for period-based summaries; calendar fallback for any
// legacy rows that predate the 4-week periods.
function summaryLabel(s: any) {
  if (s.period) {
    const from = (s.period - 1) * WEEKS_PER_MONTH + 1
    const to = s.period * WEEKS_PER_MONTH
    return `Month ${s.period} · Weeks ${from}–${to}`
  }
  return `${MONTHS[s.month - 1] ?? ''} ${s.year ?? ''}`.trim()
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <template v-else>
      <!-- Student header -->
      <div class="card mb-6 p-4 sm:p-6">
        <h1 class="text-xl font-bold text-caleb-text">{{ student?.full_name || 'Student' }}</h1>
        <dl class="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-4">
          <div><dt class="text-xs uppercase text-gray-400">Matric</dt><dd>{{ student?.matric_no || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Department</dt><dd>{{ student?.department || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Company</dt><dd>{{ student?.company_name || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Email</dt><dd class="truncate">{{ student?.email || '—' }}</dd></div>
        </dl>
      </div>

      <!-- Tabs -->
      <div v-if="showSummaries" class="mb-4 flex gap-2">
        <button class="btn" :class="tab === 'entries' ? 'btn-primary' : 'btn-outline'" @click="tab = 'entries'">
          Daily Entries ({{ entries.length }})
        </button>
        <button class="btn" :class="tab === 'summaries' ? 'btn-primary' : 'btn-outline'" @click="tab = 'summaries'">
          Monthly Summaries ({{ summaries.length }})
        </button>
      </div>

      <!-- Entries -->
      <div v-show="tab === 'entries'">
        <div v-if="!entries.length" class="card p-10 text-center text-gray-500">No entries yet.</div>
        <div v-else class="space-y-6">
          <WeekApprovalGroup
            v-for="g in weekGroups"
            :key="g.weekNumber"
            :week-number="g.weekNumber"
            :entries="g.entries"
            :can="can"
          />
        </div>
      </div>

      <!-- Summaries -->
      <div v-if="showSummaries" v-show="tab === 'summaries'">
        <div v-if="!summaries.length" class="card p-10 text-center text-gray-500">No summaries yet.</div>
        <div v-else class="space-y-6">
          <article v-for="s in summaries" :key="s.id" class="card overflow-hidden">
            <header class="flex items-center justify-between border-b-2 border-caleb-cyan-dark bg-caleb-surface px-4 py-3">
              <h3 class="font-semibold">{{ summaryLabel(s) }}</h3>
              <StatusPill :status="s.status" />
            </header>
            <div class="space-y-4 px-4 py-4">
              <p class="logbook-lines whitespace-pre-wrap text-[15px]">{{ s.content }}</p>
              <EntryFeedback :summary-id="s.id" :can="can" />
            </div>
          </article>
        </div>
      </div>
    </template>
  </div>
</template>
