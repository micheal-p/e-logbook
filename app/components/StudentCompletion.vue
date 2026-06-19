<script setup lang="ts">
// End-of-placement completion flow for the student:
//   1. print the logbook report  2. upload the company-stamped copy
//   3. await the academic supervisor's final approval  4. download certificate
const client = useSupabaseClient<any>()
const uid = useUid()

const row = ref<any | null>(null)
const loading = ref(true)
const uploading = ref(false)

async function load() {
  loading.value = true
  const { data } = await client.from('completions').select('*').eq('student_id', uid.value!).maybeSingle()
  row.value = data
  loading.value = false
}

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

onMounted(load)
</script>

<template>
  <section class="card overflow-hidden">
    <header class="border-b-2 border-caleb-navy bg-caleb-surface px-4 py-3">
      <h2 class="font-semibold text-caleb-navy">Finish &amp; get your SIWES certificate</h2>
      <p class="text-xs text-gray-500">Complete these steps at the end of your placement.</p>
    </header>

    <div v-if="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>

    <ol v-else class="divide-y divide-gray-100">
      <!-- Step 1: print -->
      <li class="flex items-start gap-3 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-caleb-navy text-xs font-bold text-white">1</span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Print your logbook report</p>
          <p class="text-sm text-gray-500">Download it as PDF, print, and take it to your company supervisor to stamp and sign.</p>
          <NuxtLink to="/student/report" target="_blank" class="btn-secondary mt-2 inline-block">Open / download report</NuxtLink>
        </div>
      </li>

      <!-- Step 2: upload stamped -->
      <li class="flex items-start gap-3 p-4">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :class="uploaded ? 'bg-caleb-green' : 'bg-caleb-navy'">
          {{ uploaded ? '✓' : '2' }}
        </span>
        <div class="flex-1">
          <p class="font-medium text-caleb-navy">Upload the stamped report</p>
          <p class="text-sm text-gray-500">Scan or photograph the stamped, signed report and upload it here.</p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <label class="btn-outline cursor-pointer">
              {{ uploading ? 'Uploading…' : uploaded ? 'Replace file' : 'Upload stamped report' }}
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
          <p v-else class="text-sm text-gray-400">Upload your stamped report first, then your supervisor can approve.</p>
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
