<script setup lang="ts">
// Academic supervisor's final SIWES approval for one student: review the
// uploaded stamped report, sign once, and approve. Shown on the supervisor's
// student page.
const props = defineProps<{ studentId: string }>()
const client = useSupabaseClient<any>()

const row = ref<any | null>(null)
const loading = ref(true)
const comment = ref('')
const saving = ref(false)
const pad = ref<any>(null)

async function load() {
  loading.value = true
  const { data } = await client
    .from('completions')
    .select('*, approver:profiles!completions_academic_approver_id_fkey(full_name)')
    .eq('student_id', props.studentId)
    .maybeSingle()
  row.value = data
  comment.value = data?.academic_comment ?? ''
  loading.value = false
}

const uploaded = computed(() => !!row.value?.stamped_report_url)
const approved = computed(() => !!row.value?.academic_approved)

async function approve() {
  const signature = pad.value?.toDataURL?.()
  if (!signature) {
    alert('Please sign in the box before approving.')
    return
  }
  if (!confirm('Approve and sign off this student’s SIWES? This unlocks their completion certificate.')) return
  saving.value = true
  try {
    const { error } = await client
      .from('completions')
      .update({
        academic_approved: true,
        academic_signature: signature,
        academic_comment: comment.value.trim() || null,
      })
      .eq('student_id', props.studentId)
    if (error) throw error
    await load()
  } catch (err: any) {
    alert(err?.data?.statusMessage || err?.message || 'Could not approve')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section v-if="!loading" class="card mb-6 overflow-hidden">
    <header class="border-b-2 border-caleb-navy bg-caleb-surface px-4 py-3">
      <h2 class="font-semibold text-caleb-navy">Final SIWES approval</h2>
      <p class="text-xs text-gray-500">Review the ITF-stamped report, then sign once to complete the student's SIWES.</p>
    </header>

    <div class="p-4">
      <!-- Already approved -->
      <div v-if="approved" class="rounded-lg bg-green-50 p-3">
        <p class="text-sm font-semibold text-green-800">✓ Approved</p>
        <p class="text-xs text-gray-500">Signed off by {{ row.approver?.full_name || 'you' }}.</p>
        <img v-if="row.academic_signature" :src="row.academic_signature" class="mt-2 h-16 rounded border bg-white" alt="signature" />
      </div>

      <!-- Awaiting the student's stamped upload -->
      <p v-else-if="!uploaded" class="text-sm text-amber-600">
        Waiting for the student to upload their ITF-stamped report. You can approve once it's uploaded.
      </p>

      <!-- Ready to approve -->
      <template v-else>
        <a :href="row.stamped_report_url" target="_blank" class="btn-outline mb-4 inline-block">View ITF-stamped report</a>

        <label class="label">Comment (optional)</label>
        <textarea v-model="comment" rows="2" class="field mb-3" placeholder="Any remarks…" />

        <label class="label">Your signature</label>
        <SignaturePad ref="pad" />

        <button class="btn-primary mt-3" :disabled="saving" @click="approve">
          {{ saving ? 'Approving…' : 'Approve & sign off SIWES' }}
        </button>
      </template>
    </div>
  </section>
</template>
