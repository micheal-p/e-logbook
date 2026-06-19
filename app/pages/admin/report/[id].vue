<script setup lang="ts">
// Printable SIWES logbook report for one student. layout:false so there's no
// dashboard chrome; the global role middleware still restricts this to admins.
definePageMeta({ layout: false })
const route = useRoute()
const client = useSupabaseClient<any>()
const id = route.params.id as string

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SIWES_DAYS = 24 * 7

const student = ref<any | null>(null)
const assignment = ref<any | null>(null)
const siwesStart = ref<string | null>(null)
const entries = ref<any[]>([])
const summaries = ref<any[]>([])
const signoffs = ref<any[]>([])
const loading = ref(true)

function weekday(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function stampsFor(list: any[], key: string, idVal: number) {
  return list.filter((a) => a[key] === idVal && a.stamped)
}

const approvalsByEntry = ref<any[]>([])
const approvalsBySummary = ref<any[]>([])

const period = computed(() => {
  const startStr = siwesStart.value
  if (!startStr) return null
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(start.getTime() + SIWES_DAYS * 86400000)
  const f = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${f(start)} — ${f(end)}`
})

async function load() {
  loading.value = true
  const [p, a, e, s] = await Promise.all([
    client.from('profiles').select('*').eq('id', id).single(),
    client.from('assignments').select('*, supervisor:profiles!assignments_supervisor_id_fkey(full_name), company:profiles!assignments_company_supervisor_id_fkey(full_name)').eq('student_id', id).maybeSingle(),
    client.from('entries').select('*').eq('student_id', id).order('entry_date', { ascending: true }),
    client.from('summaries').select('*').eq('student_id', id).order('year').order('month'),
  ])
  student.value = p.data
  assignment.value = a.data
  entries.value = e.data ?? []
  summaries.value = s.data ?? []

  const { data: so } = await client.from('signoffs').select('*').eq('student_id', id).order('week_number')
  signoffs.value = so ?? []
  siwesStart.value = await getSiwesStart()

  const eIds = entries.value.map((x) => x.id)
  const sIds = summaries.value.map((x) => x.id)
  if (eIds.length) {
    const { data } = await client.from('approvals').select('*, approver:profiles!approvals_approver_id_fkey(full_name, role)').in('entry_id', eIds)
    approvalsByEntry.value = data ?? []
  }
  if (sIds.length) {
    const { data } = await client.from('approvals').select('*, approver:profiles!approvals_approver_id_fkey(full_name, role)').in('summary_id', sIds)
    approvalsBySummary.value = data ?? []
  }
  loading.value = false
}

function printReport() {
  if (import.meta.client) window.print()
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gray-100 print:bg-white">
    <!-- toolbar (hidden when printing) -->
    <div class="no-print sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3 print:hidden">
      <NuxtLink to="/admin" class="text-sm text-caleb-cyan-dark hover:underline">← Back to overview</NuxtLink>
      <button class="btn-primary" @click="printReport">Download / Print PDF</button>
    </div>

    <div v-if="loading" class="p-12 text-center text-gray-400">Loading report…</div>

    <!-- The printable sheet -->
    <div v-else class="report mx-auto my-6 max-w-[800px] bg-white p-10 shadow print:my-0 print:max-w-none print:shadow-none">
      <!-- Header -->
      <header class="flex items-center gap-4 border-b-4 border-caleb-navy pb-4">
        <img src="/caleb-logo.png" alt="Caleb University" class="h-16 w-auto" />
        <div class="flex-1 text-center">
          <h1 class="text-lg font-extrabold leading-tight text-caleb-navy">CALEB UNIVERSITY, LAGOS</h1>
          <p class="text-sm font-semibold text-caleb-cyan-dark">
            STUDENTS INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)
          </p>
          <p class="text-xs text-gray-500">E-Logbook Report · For God and Humanity</p>
        </div>
      </header>

      <!-- Student bio -->
      <section class="mt-6 flex gap-6">
        <img v-if="student?.avatar_url" :src="student.avatar_url" alt="passport" class="h-28 w-24 rounded border object-cover" />
        <div v-else class="flex h-28 w-24 items-center justify-center rounded border text-xs text-gray-400">No photo</div>
        <dl class="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div><dt class="text-xs uppercase text-gray-400">Name</dt><dd class="font-semibold">{{ student?.full_name || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Matric No</dt><dd>{{ student?.matric_no || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Department</dt><dd>{{ student?.department || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Company</dt><dd>{{ student?.company_name || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Academic Supervisor</dt><dd>{{ assignment?.supervisor?.full_name || '—' }}</dd></div>
          <div><dt class="text-xs uppercase text-gray-400">Company Supervisor</dt><dd>{{ assignment?.company?.full_name || '—' }}</dd></div>
          <div class="col-span-2"><dt class="text-xs uppercase text-gray-400">SIWES Period</dt><dd>{{ period || 'Not set' }}</dd></div>
        </dl>
      </section>

      <!-- Daily entries -->
      <section class="mt-8">
        <h2 class="mb-3 border-b border-gray-300 pb-1 text-base font-bold text-caleb-navy">
          Daily Entries ({{ entries.length }})
        </h2>
        <p v-if="!entries.length" class="text-sm text-gray-400">No entries recorded.</p>
        <article v-for="e in entries" :key="e.id" class="report-entry mb-4 break-inside-avoid border-b border-dashed border-gray-200 pb-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-caleb-navy">{{ weekday(e.entry_date) }}</p>
            <p class="text-xs text-gray-500">Week {{ e.week_number || '—' }}</p>
          </div>
          <p class="mt-1 whitespace-pre-wrap text-sm text-gray-800">{{ e.content }}</p>
          <img v-if="e.media_url" :src="e.media_url" class="mt-2 max-h-48 rounded border" alt="attachment" />
          <p class="mt-2 text-xs">
            <span class="text-gray-400">Approvals:</span>
            <template v-if="stampsFor(approvalsByEntry, 'entry_id', e.id).length">
              <span v-for="ap in stampsFor(approvalsByEntry, 'entry_id', e.id)" :key="ap.id" class="ml-1 font-medium text-caleb-green">
                ✓ {{ ap.approver?.full_name }}<template v-if="ap.grade"> (Grade: {{ ap.grade }})</template>;
              </span>
            </template>
            <span v-else class="ml-1 italic text-gray-400">none</span>
          </p>
        </article>
      </section>

      <!-- Monthly summaries -->
      <section class="mt-8">
        <h2 class="mb-3 border-b border-gray-300 pb-1 text-base font-bold text-caleb-navy">
          Monthly Summaries ({{ summaries.length }})
        </h2>
        <p v-if="!summaries.length" class="text-sm text-gray-400">No summaries recorded.</p>
        <article v-for="s in summaries" :key="s.id" class="report-entry mb-4 break-inside-avoid border-b border-dashed border-gray-200 pb-3">
          <p class="text-sm font-semibold text-caleb-navy">{{ MONTHS[s.month - 1] }} {{ s.year }}</p>
          <p class="mt-1 whitespace-pre-wrap text-sm text-gray-800">{{ s.content }}</p>
          <p class="mt-2 text-xs">
            <span class="text-gray-400">Approvals:</span>
            <template v-if="stampsFor(approvalsBySummary, 'summary_id', s.id).length">
              <span v-for="ap in stampsFor(approvalsBySummary, 'summary_id', s.id)" :key="ap.id" class="ml-1 font-medium text-caleb-green">
                ✓ {{ ap.approver?.full_name }}<template v-if="ap.grade"> (Grade: {{ ap.grade }})</template>;
              </span>
            </template>
            <span v-else class="ml-1 italic text-gray-400">none</span>
          </p>
        </article>
      </section>

      <!-- Work supervisor sign-offs -->
      <section class="mt-8">
        <h2 class="mb-3 border-b border-gray-300 pb-1 text-base font-bold text-caleb-navy">
          Work Supervisor Sign-offs ({{ signoffs.length }})
        </h2>
        <p v-if="!signoffs.length" class="text-sm text-gray-400">No weeks signed yet.</p>
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div v-for="so in signoffs" :key="so.id" class="break-inside-avoid rounded border border-gray-200 p-3">
            <p class="text-sm font-semibold text-caleb-navy">
              Week {{ so.week_number }}
              <span class="font-normal text-gray-500">({{ so.week_start }} – {{ so.week_end }})</span>
            </p>
            <p class="text-sm">{{ so.signer_name }} <span class="text-gray-500">· {{ so.signer_role }}</span></p>
            <p v-if="so.comment" class="mt-1 text-xs italic text-gray-600">"{{ so.comment }}"</p>
            <img v-if="so.signature" :src="so.signature" class="mt-1 h-14 rounded border bg-white" alt="signature" />
          </div>
        </div>
      </section>

      <footer class="mt-10 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
        Generated from the Caleb University SIWES E-Logbook.
      </footer>
    </div>
  </div>
</template>

<style>
@media print {
  @page { margin: 14mm; }
  html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
