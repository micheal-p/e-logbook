<script setup lang="ts">
// SIWES completion certificate. Only renders once the academic supervisor has
// approved; otherwise it sends the student back to their logbook.
definePageMeta({ layout: false })
const client = useSupabaseClient<any>()
const uid = useUid()

const me = ref<any | null>(null)
const completion = ref<any | null>(null)
const supervisor = ref<string | null>(null)
const startStr = ref<string | null>(null)
const loading = ref(true)

const SIWES_DAYS = 24 * 7
function fmt(d: string | Date) {
  return new Date(typeof d === 'string' ? d : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
const period = computed(() => {
  if (!startStr.value) return null
  const s = new Date(startStr.value + 'T00:00:00')
  const e = new Date(s.getTime() + SIWES_DAYS * 86400000)
  return `${fmt(s)} — ${fmt(e)}`
})

async function load() {
  const [p, c, a] = await Promise.all([
    client.from('profiles').select('*').eq('id', uid.value!).single(),
    client.from('completions').select('*, approver:profiles!completions_academic_approver_id_fkey(full_name)').eq('student_id', uid.value!).maybeSingle(),
    client.from('assignments').select('supervisor:profiles!assignments_supervisor_id_fkey(full_name)').eq('student_id', uid.value!).maybeSingle(),
  ])
  me.value = p.data
  completion.value = c.data
  supervisor.value = (a.data as any)?.supervisor?.full_name ?? c.data?.approver?.full_name ?? null
  startStr.value = await getSiwesStart()
  loading.value = false
  if (!c.data?.academic_approved) navigateTo('/student', { replace: true })
}

function printCert() {
  if (import.meta.client) window.print()
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gray-100 print:bg-white">
    <div class="no-print sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3 print:hidden">
      <NuxtLink to="/student" class="text-sm text-caleb-cyan-dark hover:underline">← Back to my logbook</NuxtLink>
      <button class="btn-primary" @click="printCert">Download / Print PDF</button>
    </div>

    <div v-if="loading" class="p-12 text-center text-gray-400">Loading…</div>

    <div v-else-if="completion?.academic_approved" class="mx-auto my-6 max-w-[860px] bg-white p-4 shadow print:my-0 print:max-w-none print:shadow-none">
      <!-- Certificate sheet -->
      <div class="border-[6px] border-double border-caleb-navy p-10 text-center">
        <img src="/caleb-logo.png" alt="Caleb University" class="mx-auto h-20 w-auto" />
        <h1 class="mt-4 text-2xl font-extrabold tracking-wide text-caleb-navy">CALEB UNIVERSITY, LAGOS</h1>
        <p class="text-sm font-semibold text-caleb-cyan-dark">For God and Humanity</p>

        <p class="mt-8 text-sm uppercase tracking-[0.3em] text-gray-400">Certificate of Completion</p>
        <p class="mt-4 text-sm text-gray-600">This is to certify that</p>
        <p class="mt-2 text-3xl font-bold text-caleb-navy">{{ me?.full_name || 'Student' }}</p>
        <p class="text-sm text-gray-500">{{ me?.matric_no || '' }}<template v-if="me?.department"> · {{ me.department }}</template></p>

        <p class="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-gray-700">
          has successfully completed the Students Industrial Work Experience Scheme (SIWES)
          <template v-if="me?.company_name"> at <span class="font-semibold">{{ me.company_name }}</span></template>
          <template v-if="period"> during the period <span class="font-semibold">{{ period }}</span></template>,
          and has satisfied all the requirements of the programme.
        </p>

        <div class="mt-12 flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:justify-around sm:gap-0">
          <div class="text-center">
            <img v-if="completion.academic_signature" :src="completion.academic_signature" class="mx-auto h-16" alt="signature" />
            <div v-else class="h-16"></div>
            <div class="mx-auto w-full max-w-[14rem] border-t border-gray-400 pt-1 text-sm sm:w-56">
              <p class="font-semibold">{{ supervisor || 'Academic Supervisor' }}</p>
              <p class="text-xs text-gray-500">Academic Supervisor</p>
            </div>
          </div>
          <div class="text-center">
            <p class="h-16 pt-10 text-sm font-semibold">{{ completion.approved_at ? fmt(completion.approved_at) : '' }}</p>
            <div class="mx-auto w-full max-w-[14rem] border-t border-gray-400 pt-1 text-sm sm:w-56">
              <p class="text-xs text-gray-500">Date of approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  @page { margin: 10mm; }
  html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
