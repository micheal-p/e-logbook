<script setup lang="ts">
// The student's profile: passport photo, editable bio (name/department/company),
// read-only identity (matric/email), their academic supervisor, the SIWES period,
// and the account-deletion danger zone (moved here off the dashboard).
const client = useSupabaseClient<any>()
const uid = useUid()
const { profile, load: loadProfile } = useProfile()

const me = ref<any | null>(null)
const assignment = ref<any | null>(null)
const siwesStart = ref<string | null>(null)
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const deleting = ref(false)
const saved = ref(false)

// Editable fields the student owns.
const form = reactive({ full_name: '', department: '', company_name: '' })

async function loadAll() {
  loading.value = true
  const [p, a, start] = await Promise.all([
    client.from('profiles').select('*').eq('id', uid.value!).single(),
    client
      .from('assignments')
      .select('*, supervisor:profiles!assignments_supervisor_id_fkey(full_name, email, department, phone)')
      .eq('student_id', uid.value!)
      .maybeSingle(),
    getSiwesStart(),
  ])
  me.value = p.data
  assignment.value = a.data
  siwesStart.value = start
  form.full_name = p.data?.full_name ?? ''
  form.department = p.data?.department ?? ''
  form.company_name = p.data?.company_name ?? ''
  loading.value = false
}

// SIWES period (start → Friday of week 24), matching the logbook week math.
const period = computed(() => {
  if (!siwesStart.value) return null
  const weeks = buildWeeks(siwesStart.value)
  if (!weeks.length) return null
  const f = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${f(weeks[0].monday)} — ${f(weeks[weeks.length - 1].friday)}`
})

async function save() {
  saving.value = true
  saved.value = false
  try {
    const { error } = await client
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        department: form.department.trim() || null,
        company_name: form.company_name.trim() || null,
      })
      .eq('id', uid.value!)
    if (error) throw error
    await loadAll()
    await loadProfile(true) // refresh header name
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Could not save your details')
  } finally {
    saving.value = false
  }
}

async function onPassport(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', f)
    const { url } = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    const { error } = await client.from('profiles').update({ avatar_url: url }).eq('id', uid.value!)
    if (error) throw error
    await loadAll()
    await loadProfile(true)
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Upload failed')
  } finally {
    uploading.value = false
  }
}

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
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold text-caleb-text">My Profile</h1>
      <NuxtLink to="/student" class="text-sm text-caleb-cyan-dark hover:underline">← Back to my logbook</NuxtLink>
    </div>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <template v-else>
      <!-- Passport + identity -->
      <section class="card p-5">
        <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div class="shrink-0 text-center">
            <img
              v-if="me?.avatar_url"
              :src="me.avatar_url"
              alt="passport"
              class="h-28 w-28 rounded-xl border object-cover sm:h-32 sm:w-32"
            />
            <div v-else class="flex h-28 w-28 items-center justify-center rounded-xl bg-caleb-surface text-xs text-gray-400 sm:h-32 sm:w-32">
              No photo
            </div>
            <label class="mt-2 inline-block cursor-pointer text-sm text-caleb-cyan-dark hover:underline">
              {{ uploading ? 'Uploading…' : me?.avatar_url ? 'Change passport' : 'Upload passport' }}
              <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onPassport" />
            </label>
          </div>

          <div class="min-w-0 flex-1 text-center sm:text-left">
            <p class="text-lg font-semibold text-caleb-navy">{{ me?.full_name || 'Student' }}</p>
            <p class="text-sm text-gray-500">{{ me?.matric_no || '—' }}</p>
            <dl class="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-400">Email</dt>
                <dd class="truncate text-caleb-text">{{ me?.email || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-400">SIWES period</dt>
                <dd class="text-caleb-text">{{ period || 'Not scheduled yet' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <!-- Editable details -->
      <section class="card p-5">
        <h2 class="mb-4 font-semibold text-caleb-navy">My details</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label" for="full_name">Full name</label>
            <input id="full_name" v-model="form.full_name" class="field" placeholder="Your full name" />
          </div>
          <div>
            <label class="label" for="department">Department / Course</label>
            <input id="department" v-model="form.department" class="field" placeholder="e.g. Computer Science" />
          </div>
          <div>
            <label class="label" for="company">Company (placement)</label>
            <input id="company" v-model="form.company_name" class="field" placeholder="Where you're doing SIWES" />
          </div>
          <div>
            <label class="label">Matric number</label>
            <input :value="me?.matric_no || '—'" class="field bg-gray-50 text-gray-500" readonly />
            <p class="mt-1 text-xs text-gray-400">Set by the school — contact the admin to change.</p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <button class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
          <span v-if="saved" class="inline-flex items-center gap-1 text-sm text-caleb-green">
            <AppIcon name="check" :size="15" :stroke="2.5" /> Saved
          </span>
        </div>
      </section>

      <!-- Academic supervisor -->
      <section class="card p-5">
        <h2 class="mb-2 font-semibold text-caleb-navy">Academic supervisor</h2>
        <template v-if="assignment?.supervisor">
          <p class="text-sm font-medium text-caleb-navy">{{ assignment.supervisor.full_name || '—' }}</p>
          <p v-if="assignment.supervisor.department" class="text-xs text-gray-400">{{ assignment.supervisor.department }}</p>
          <a
            v-if="assignment.supervisor.phone"
            :href="`tel:${assignment.supervisor.phone}`"
            class="mt-1 inline-flex items-center gap-1 text-sm text-caleb-cyan-dark hover:underline"
          >
            <AppIcon name="phone" :size="14" /> {{ assignment.supervisor.phone }}
          </a>
        </template>
        <p v-else class="text-sm text-amber-600">
          Awaiting allocation — the admin hasn't assigned your supervisor yet.
        </p>
      </section>

      <!-- Danger zone -->
      <section class="card border-red-200 p-5">
        <h2 class="font-semibold text-red-700">Danger zone</h2>
        <p class="mt-1 text-sm text-gray-500">
          Deleting your account permanently removes your logbook, summaries and sign-offs. This cannot be undone.
        </p>
        <button class="btn-danger mt-3" :disabled="deleting" @click="deleteAccount">
          {{ deleting ? 'Deleting…' : 'Delete my account' }}
        </button>
      </section>
    </template>
  </div>
</template>
