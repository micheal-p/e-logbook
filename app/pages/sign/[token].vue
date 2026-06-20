<script setup lang="ts">
// Public page opened by the work (company) supervisor from the student's link.
// They scroll completed, past weeks and sign each one. No login required.
definePageMeta({ layout: false })
const route = useRoute()
const token = route.params.token as string

const data = ref<any | null>(null)
const loading = ref(true)
const loadError = ref('')

const entriesByDate = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const e of data.value?.entries ?? []) m[e.entry_date] = e
  return m
})
const signoffByWeek = computed<Record<number, any>>(() => {
  const m: Record<number, any> = {}
  for (const s of data.value?.signoffs ?? []) m[s.week_number] = s
  return m
})
const weeks = computed(() => buildWeeks(data.value?.startDate))
// Only show weeks that have been started or already signed.
const visibleWeeks = computed(() =>
  weeks.value.filter(
    (w) => w.days.some((d) => entriesByDate.value[d.date]) || signoffByWeek.value[w.week_number]
  )
)

function weekState(w: any) {
  const complete = weekComplete(w, entriesByDate.value)
  const signed = signoffByWeek.value[w.week_number]
  // Any completed, not-yet-signed week is signable — the supervisor can sign
  // earlier weeks he skipped (back-dating), not just the latest one.
  return { complete, signed, signable: complete && !signed }
}

// Per-week form state + signature pads.
const forms = reactive<Record<number, { name: string; role: string; comment: string; busy: boolean; error: string }>>({})
function formFor(n: number) {
  if (!forms[n]) forms[n] = { name: '', role: '', comment: '', busy: false, error: '' }
  return forms[n]
}
const pads = new Map<number, any>()
function setPad(n: number, el: any) {
  if (el) pads.set(n, el)
  else pads.delete(n)
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    data.value = await $fetch(`/api/share/${token}`)
  } catch (e: any) {
    loadError.value = e?.data?.statusMessage || 'This link is invalid or has expired.'
  } finally {
    loading.value = false
  }
}

async function sign(w: any) {
  const f = formFor(w.week_number)
  f.error = ''
  const signature = pads.get(w.week_number)?.toDataURL()
  if (!f.name.trim() || !f.role.trim()) {
    f.error = 'Please enter your name and your role at the company.'
    return
  }
  if (!signature) {
    f.error = 'Please draw your signature.'
    return
  }
  f.busy = true
  try {
    await $fetch(`/api/share/${token}/sign`, {
      method: 'POST',
      body: {
        week_number: w.week_number,
        week_start: w.monday,
        week_end: w.friday,
        signer_name: f.name,
        signer_role: f.role,
        comment: f.comment,
        signature,
      },
    })
    await load()
  } catch (e: any) {
    f.error = e?.data?.statusMessage || 'Could not save your signature.'
  } finally {
    f.busy = false
  }
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

onMounted(load)
useHead({ title: 'SIWES Sign-off — Caleb University' })
</script>

<template>
  <div class="min-h-screen bg-caleb-surface">
    <header class="border-b-4 border-caleb-navy bg-white">
      <div class="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <img src="/caleb-logo.png" alt="Caleb University" class="h-12 w-auto" />
        <div>
          <p class="text-sm font-bold text-caleb-navy">Caleb University — SIWES Sign-off</p>
          <p class="text-xs text-gray-500">Work supervisor review</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-6">
      <div v-if="loading" class="py-16 text-center text-gray-400">Loading report…</div>
      <div v-else-if="loadError" class="card p-10 text-center text-red-600">{{ loadError }}</div>

      <template v-else>
        <!-- Student header -->
        <div class="card mb-6 flex items-center gap-4 p-4">
          <img v-if="data.student?.avatar_url" :src="data.student.avatar_url" class="h-16 w-14 rounded border object-cover" alt="passport" />
          <div>
            <h1 class="text-lg font-bold text-caleb-navy">{{ data.student?.full_name }}</h1>
            <p class="text-sm text-gray-500">
              {{ data.student?.matric_no || '—' }} · {{ data.student?.department || '—' }} · {{ data.student?.company_name || '—' }}
            </p>
          </div>
        </div>

        <p class="mb-4 text-sm text-gray-600">
          Please review each completed week below and sign it off. You can only sign weeks that have
          finished and are fully filled in.
        </p>

        <div v-if="!visibleWeeks.length" class="card p-10 text-center text-gray-500">
          This student hasn't filled in any weeks yet.
        </div>

        <div v-for="w in visibleWeeks" :key="w.week_number" class="card mb-5 overflow-hidden">
          <header class="flex items-center justify-between border-b border-gray-200 bg-caleb-surface px-4 py-2">
            <h2 class="font-semibold text-caleb-navy">Week {{ w.week_number }}</h2>
            <span class="text-xs text-gray-500">{{ fmt(w.monday) }} – {{ fmt(w.friday) }}</span>
          </header>

          <!-- Days -->
          <div class="divide-y divide-gray-100 px-4">
            <div v-for="d in w.days" :key="d.date" class="py-2">
              <p class="text-xs font-semibold text-caleb-cyan-dark">{{ d.weekday }} · {{ fmt(d.date) }}</p>
              <p class="whitespace-pre-wrap text-sm text-gray-800">
                {{ entriesByDate[d.date]?.content || '—' }}
              </p>
              <img v-if="entriesByDate[d.date]?.media_url" :src="entriesByDate[d.date].media_url" class="mt-1 max-h-40 rounded border" alt="attachment" />
            </div>
          </div>

          <!-- Sign-off area -->
          <div class="border-t border-gray-200 px-4 py-3">
            <div v-if="weekState(w).signed" class="rounded-lg bg-green-50 p-3">
              <p class="flex items-center gap-1.5 text-sm font-semibold text-green-800">
                <AppIcon name="check" :size="15" :stroke="2.5" /> Signed by {{ signoffByWeek[w.week_number].signer_name }}
                <span class="font-normal text-gray-600">({{ signoffByWeek[w.week_number].signer_role }})</span>
              </p>
              <p v-if="signoffByWeek[w.week_number].comment" class="mt-1 text-sm text-gray-700">
                “{{ signoffByWeek[w.week_number].comment }}”
              </p>
              <img :src="signoffByWeek[w.week_number].signature" class="mt-2 h-16 rounded border bg-white" alt="signature" />
            </div>

            <div v-else-if="weekState(w).signable">
              <p class="mb-2 text-sm font-semibold text-caleb-navy">Sign this week</p>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input v-model="formFor(w.week_number).name" class="field" placeholder="Your full name" />
                <input v-model="formFor(w.week_number).role" class="field" placeholder="Your role at the company" />
              </div>
              <textarea v-model="formFor(w.week_number).comment" rows="2" class="field mt-3" placeholder="Comment on the student's progress" />
              <p class="label mt-3">Signature</p>
              <SignaturePad :ref="(el) => setPad(w.week_number, el)" />
              <p v-if="formFor(w.week_number).error" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {{ formFor(w.week_number).error }}
              </p>
              <button class="btn-primary mt-3" :disabled="formFor(w.week_number).busy" @click="sign(w)">
                {{ formFor(w.week_number).busy ? 'Saving…' : 'Sign week ' + w.week_number }}
              </button>
            </div>

            <p v-else class="text-sm italic text-gray-400">
              This week isn't complete yet — nothing to sign.
            </p>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
