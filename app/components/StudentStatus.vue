<script setup lang="ts">
// Top-of-dashboard panel for the student: passport photo, who their
// supervisors are (or 'awaiting allocation'), the SIWES countdown, and a
// delete-account action.
const client = useSupabaseClient<any>()
const user = useSupabaseUser()
const { profile, load } = useProfile()

const SIWES_WEEKS = 24 // 6 months
const SIWES_DAYS = SIWES_WEEKS * 7

const me = ref<any | null>(null)
const assignment = ref<any | null>(null)
const loading = ref(true)
const uploading = ref(false)
const deleting = ref(false)

async function loadAll() {
  loading.value = true
  const [p, a] = await Promise.all([
    client.from('profiles').select('*').eq('id', user.value!.id).single(),
    client
      .from('assignments')
      .select(
        '*, supervisor:profiles!assignments_supervisor_id_fkey(full_name, email, department), company:profiles!assignments_company_supervisor_id_fkey(full_name, email, company_name)'
      )
      .eq('student_id', user.value!.id)
      .maybeSingle(),
  ])
  me.value = p.data
  assignment.value = a.data
  loading.value = false
}

// --- SIWES countdown -------------------------------------------------------
const countdown = computed(() => {
  if (!assignment.value) return null
  const startStr = assignment.value.start_date || assignment.value.created_at?.slice(0, 10)
  if (!startStr) return null
  const start = new Date(startStr + 'T00:00:00')
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00')
  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86400000)
  const remaining = Math.max(0, SIWES_DAYS - elapsed)
  return {
    weeks: Math.floor(remaining / 7),
    days: remaining % 7,
    elapsedDays: Math.max(0, elapsed),
    remaining,
    pct: Math.min(100, Math.round((Math.min(elapsed, SIWES_DAYS) / SIWES_DAYS) * 100)),
    start: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  }
})

// --- Passport photo --------------------------------------------------------
async function onPassport(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', f)
    const { url } = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    const { error } = await client.from('profiles').update({ avatar_url: url }).eq('id', user.value!.id)
    if (error) throw error
    await loadAll()
    await load(true) // refresh cached profile (header etc.)
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Upload failed')
  } finally {
    uploading.value = false
  }
}

// --- Delete account --------------------------------------------------------
async function deleteAccount() {
  if (!confirm('Delete your account? This permanently removes all your entries and summaries.')) return
  if (!confirm('This cannot be undone. Are you absolutely sure?')) return
  deleting.value = true
  try {
    await $fetch('/api/account/delete', { method: 'POST' })
    await client.auth.signOut()
    profile.value = null
    await navigateTo('/')
  } catch (err: any) {
    deleting.value = false
    alert(err?.data?.statusMessage || err?.message || 'Could not delete account')
  }
}

onMounted(loadAll)
</script>

<template>
  <div v-if="!loading" class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
    <!-- Passport + identity -->
    <div class="card flex items-center gap-4 p-4">
      <div class="relative">
        <img
          v-if="me?.avatar_url"
          :src="me.avatar_url"
          alt="passport"
          class="h-20 w-20 rounded-lg border object-cover"
        />
        <div v-else class="flex h-20 w-20 items-center justify-center rounded-lg bg-caleb-surface text-xs text-gray-400">
          No photo
        </div>
      </div>
      <div class="min-w-0">
        <p class="truncate font-semibold text-caleb-navy">{{ me?.full_name || 'Student' }}</p>
        <p class="truncate text-xs text-gray-500">{{ me?.matric_no || '—' }}</p>
        <label class="mt-2 inline-block cursor-pointer text-sm text-caleb-cyan-dark hover:underline">
          {{ uploading ? 'Uploading…' : me?.avatar_url ? 'Change passport' : 'Upload passport' }}
          <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onPassport" />
        </label>
      </div>
    </div>

    <!-- Supervisors -->
    <div class="card p-4">
      <h3 class="text-sm font-semibold text-caleb-navy">Your supervisors</h3>
      <template v-if="assignment">
        <p class="mt-2 text-sm">
          <span class="text-gray-500">Academic:</span>
          {{ assignment.supervisor?.full_name || 'Not assigned' }}
        </p>
        <p class="mt-1 text-sm">
          <span class="text-gray-500">Company:</span>
          {{ assignment.company?.full_name || 'Not assigned' }}
        </p>
      </template>
      <p v-else class="mt-2 text-sm text-amber-600">
        Awaiting allocation — the admin hasn't assigned your supervisors yet.
      </p>
    </div>

    <!-- Countdown -->
    <div class="card p-4">
      <h3 class="text-sm font-semibold text-caleb-navy">SIWES progress</h3>
      <template v-if="countdown">
        <p v-if="countdown.remaining > 0" class="mt-2 text-2xl font-extrabold text-caleb-navy">
          {{ countdown.weeks }}w {{ countdown.days }}d
          <span class="text-sm font-normal text-gray-500">remaining</span>
        </p>
        <p v-else class="mt-2 text-lg font-bold text-caleb-green">SIWES period complete 🎓</p>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div class="h-full bg-caleb-cyan" :style="{ width: countdown.pct + '%' }" />
        </div>
        <p class="mt-1 text-xs text-gray-400">
          Started {{ countdown.start }} · {{ SIWES_WEEKS }}-week programme
        </p>
      </template>
      <p v-else class="mt-2 text-sm text-gray-500">
        Your start date is set when the admin allocates you.
      </p>
    </div>

    <!-- Danger zone -->
    <div class="lg:col-span-3">
      <button class="text-sm text-red-600 hover:underline" :disabled="deleting" @click="deleteAccount">
        {{ deleting ? 'Deleting…' : 'Delete my account' }}
      </button>
    </div>
  </div>
</template>
