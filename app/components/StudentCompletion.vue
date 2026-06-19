<script setup lang="ts">
// End-of-placement completion flow. Locked until the student has filled the
// WHOLE logbook (all 24 weeks + all 6 monthly summaries). Once complete:
//   1. download the logbook report  2. get it ITF-stamped & signed, upload it
//   3. await the academic supervisor's final approval  4. download certificate
const client = useSupabaseClient<any>()
const uid = useUid()

const start = ref<string | null>(null)
const entries = ref<any[]>([])
const summaries = ref<any[]>([])
const row = ref<any | null>(null)
const loading = ref(true)
const uploading = ref(false)

async function load() {
  loading.value = true
  const [s, e, sm, c] = await Promise.all([
    getSiwesStart(),
    client.from('entries').select('entry_date, content').eq('student_id', uid.value!),
    client.from('summaries').select('period, content').eq('student_id', uid.value!),
    client.from('completions').select('*').eq('student_id', uid.value!).maybeSingle(),
  ])
  start.value = s
  entries.value = e.data ?? []
  summaries.value = sm.data ?? []
  row.value = c.data
  loading.value = false
}

// --- completeness ----------------------------------------------------------
const entriesByDate = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const e of entries.value) m[e.entry_date] = e
  return m
})
const weeks = computed(() => buildWeeks(start.value))
const months = computed(() => buildMonths(start.value, weeks.value))
const summaryByPeriod = computed<Record<number, any>>(() => {
  const m: Record<number, any> = {}
  for (const s of summaries.value) if (s.period) m[s.period] = s
  return m
})
const weeksDone = computed(() => weeks.value.filter((w) => weekComplete(w, entriesByDate.value)).length)
const summariesDone = computed(
  () => months.value.filter((m) => (summaryByPeriod.value[m.period]?.content ?? '').trim().length > 0).length
)
const totalWeeks = computed(() => weeks.value.length)
const totalMonths = computed(() => months.value.length)
const logbookComplete = computed(
  () =>
    !!start.value &&
    totalWeeks.value > 0 &&
    weeksDone.value === totalWeeks.value &&
    summariesDone.value === totalMonths.value
)

async function onStamped(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', f)
    const { url } = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    const { error } = await client.from('completions').upsert(
      { student_id: uid.value!, stamped_report_url: url, stamped_uploaded_at: new Date().toISOString() },
      { onConflict: 'student_id' }
    )
    if (error) throw error
    await load()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Upload failed')
  } finally {
    uploading.value = false
  }
}

const approved = computed(() => !!row.value?.academic_approved)
const uploaded = computed(() => !!row.value?.stamped_report_url)
</script>

<template>
  <section class="card overflow-hidden">
    <header class="border-b-2 border-caleb-navy bg-caleb-surface px-4 py-3">
      <h2 class="font-semibold text-caleb-navy">Finish &amp; get your SIWES certificate</h2>
      <p class="text-xs text-gray-500">Available once your full logbook is complete.</p>
    </header>

    <div v-if="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>

    <!-- Locked until everything is filled -->
    <div v-else-if="!logbookComplete" class="p-6">
      <div class="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
        <span class="text-xl">🔒</span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Complete your logbook to unlock this</p>
          <p class="mt-1 text-sm text-gray-500">
            At the end of your 24 weeks you'll be prompted to download your report for the ITF stamp. Fill in
            every week and all monthly summaries first.
          </p>
          <div class="mt-3 grid grid-cols-2 gap-3 text-sm sm:max-w-sm">
            <div class="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <p class="font-semibold text-caleb-navy">{{ weeksDone }} / {{ totalWeeks || 24 }}</p>
              <p class="text-xs text-gray-500">weeks complete</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <p class="font-semibold text-caleb-navy">{{ summariesDone }} / {{ totalMonths || 6 }}</p>
              <p class="text-xs text-gray-500">monthly summaries</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unlocked flow -->
    <ol v-else class="divide-y divide-gray-100">
      <!-- Step 1: download -->
      <li class="flex items-start gap-3 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-caleb-navy text-xs font-bold text-white">1</span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Download your logbook report</p>
          <p class="text-sm text-gray-500">Your logbook is complete. Download it as PDF and print it, then take it for the <strong>ITF stamp</strong> and your company supervisor's signature.</p>
          <NuxtLink to="/student/report" target="_blank" class="btn-secondary mt-2 inline-block">Open / download report</NuxtLink>
        </div>
      </li>

      <!-- Step 2: upload ITF-stamped -->
      <li class="flex items-start gap-3 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :class="uploaded ? 'bg-caleb-green' : 'bg-caleb-navy'">
          {{ uploaded ? '✓' : '2' }}
        </span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Upload the ITF-stamped report</p>
          <p class="text-sm text-gray-500">Scan or photograph the ITF-stamped, signed report and upload it here.</p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <label class="btn-outline cursor-pointer">
              {{ uploading ? 'Uploading…' : uploaded ? 'Replace file' : 'Upload ITF-stamped report' }}
              <input type="file" accept="image/*,application/pdf" class="hidden" :disabled="uploading" @change="onStamped" />
            </label>
            <a v-if="uploaded" :href="row.stamped_report_url" target="_blank" class="text-sm text-caleb-cyan-dark hover:underline">View uploaded file</a>
          </div>
        </div>
      </li>

      <!-- Step 3: academic approval -->
      <li class="flex items-start gap-3 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :class="approved ? 'bg-caleb-green' : 'bg-gray-300'">
          {{ approved ? '✓' : '3' }}
        </span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Academic supervisor approval</p>
          <p v-if="approved" class="text-sm text-caleb-green">Approved — your SIWES is signed off.</p>
          <p v-else-if="uploaded" class="text-sm text-amber-600">Awaiting your academic supervisor's final approval.</p>
          <p v-else class="text-sm text-gray-400">Upload your ITF-stamped report first, then your supervisor can approve.</p>
        </div>
      </li>

      <!-- Step 4: certificate -->
      <li class="flex items-start gap-3 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :class="approved ? 'bg-caleb-green' : 'bg-gray-300'">4</span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Download your completion certificate</p>
          <template v-if="approved">
            <p class="text-sm text-gray-500">Your SIWES completion certificate is ready.</p>
            <NuxtLink to="/student/certificate" target="_blank" class="btn-primary mt-2 inline-block">Download certificate</NuxtLink>
          </template>
          <p v-else class="text-sm text-gray-400">Available once your supervisor approves.</p>
        </div>
      </li>
    </ol>
  </section>
</template>
