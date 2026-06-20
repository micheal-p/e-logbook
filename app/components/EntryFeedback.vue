<script setup lang="ts">
// Renders the approval stamps + comment thread that sit under a daily entry
// or a monthly summary, and (when allowed) the controls to comment / approve
// / grade / apply the final stamp. Pass exactly one of entryId or summaryId.
const props = withDefaults(
  defineProps<{
    entryId?: number | null
    summaryId?: number | null
    can?: { comment?: boolean; approve?: boolean; grade?: boolean }
  }>(),
  { entryId: null, summaryId: null, can: () => ({}) }
)

const client = useSupabaseClient<any>()
const uid = useUid()
const { profile } = useProfile()

const targetCol = computed(() => (props.entryId != null ? 'entry_id' : 'summary_id'))
const targetId = computed(() => props.entryId ?? props.summaryId)

const comments = ref<any[]>([])
const approvals = ref<any[]>([])
const loading = ref(true)
const newComment = ref('')
const busy = ref(false)
const gradeInput = ref('')

const myApproval = computed(() =>
  approvals.value.find((a) => a.approver_id === uid.value)
)

async function load() {
  if (targetId.value == null) return
  loading.value = true
  const [c, a] = await Promise.all([
    client
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(full_name, role)')
      .eq(targetCol.value, targetId.value)
      .order('created_at', { ascending: true }),
    client
      .from('approvals')
      .select('*, approver:profiles!approvals_approver_id_fkey(full_name, role)')
      .eq(targetCol.value, targetId.value)
      .order('created_at', { ascending: true }),
  ])
  comments.value = c.data ?? []
  approvals.value = a.data ?? []
  gradeInput.value = myApproval.value?.grade ?? ''
  loading.value = false
}

async function postComment() {
  if (!newComment.value.trim()) return
  busy.value = true
  const { error } = await client.from('comments').insert({
    [targetCol.value]: targetId.value,
    author_id: uid.value!,
    body: newComment.value.trim(),
  })
  busy.value = false
  if (error) return alert(error.message)
  newComment.value = ''
  await load()
}

// Insert-or-update the current user's approval row for this target.
async function upsertMyApproval(patch: Record<string, any>) {
  busy.value = true
  let error
  if (myApproval.value) {
    ;({ error } = await client.from('approvals').update(patch).eq('id', myApproval.value.id))
  } else {
    ;({ error } = await client.from('approvals').insert({
      [targetCol.value]: targetId.value,
      approver_id: uid.value!,
      role: profile.value?.role,
      ...patch,
    }))
  }
  busy.value = false
  if (error) return alert(error.message)
  await load()
}

const approve = () => upsertMyApproval({ stamped: true, stamped_at: new Date().toISOString() })
const unapprove = () => upsertMyApproval({ stamped: false, stamped_at: null })
const saveGrade = () =>
  upsertMyApproval({ grade: gradeInput.value.trim() || null, stamped: true, stamped_at: new Date().toISOString() })

onMounted(load)
</script>

<template>
  <div class="border-t border-dashed border-gray-300 pt-3">
    <p v-if="loading" class="text-xs text-gray-400">Loading feedback…</p>

    <template v-else>
      <!-- Approval stamps -->
      <div class="flex flex-wrap gap-2">
        <span
          v-for="a in approvals.filter((x) => x.stamped)"
          :key="a.id"
          class="pill inline-flex items-center gap-1 bg-green-100 text-green-800"
          :title="a.stamped_at"
        >
          <AppIcon name="check" :size="13" :stroke="2.5" /> {{ ROLE_LABELS[a.approver?.role] ?? a.role }}
          <template v-if="a.grade"> · Grade: {{ a.grade }}</template>
        </span>
        <span v-if="!approvals.some((x) => x.stamped)" class="text-xs italic text-gray-400">
          Awaiting approval
        </span>
      </div>

      <!-- Comment thread -->
      <ul v-if="comments.length" class="mt-3 space-y-2">
        <li v-for="c in comments" :key="c.id" class="rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span class="font-semibold text-caleb-text">{{ c.author?.full_name || 'User' }}</span>
          <span class="ml-1 text-xs text-gray-400">{{ ROLE_LABELS[c.author?.role] }}</span>
          <p class="mt-0.5 whitespace-pre-wrap text-gray-700">{{ c.body }}</p>
        </li>
      </ul>

      <!-- Actions -->
      <div v-if="can.comment || can.approve || can.grade" class="mt-3 space-y-3">
        <div v-if="can.comment">
          <textarea
            v-model="newComment"
            rows="2"
            class="field"
            placeholder="Leave a comment…"
          />
          <button class="btn-secondary mt-2" :disabled="busy || !newComment.trim()" @click="postComment">
            Post comment
          </button>
        </div>

        <div v-if="can.approve || can.grade" class="flex flex-wrap items-end gap-3">
          <div v-if="can.grade">
            <label class="label">Grade</label>
            <input v-model="gradeInput" class="field w-28" placeholder="e.g. A / 85" />
          </div>
          <button v-if="can.grade" class="btn-primary" :disabled="busy" @click="saveGrade">
            Save grade & approve
          </button>
          <template v-else-if="can.approve">
            <button v-if="!myApproval?.stamped" class="btn-primary" :disabled="busy" @click="approve">
              Approve
            </button>
            <button v-else class="btn-outline inline-flex items-center gap-1.5" :disabled="busy" @click="unapprove">
              <AppIcon name="check" :size="15" :stroke="2.5" /> Approved — undo
            </button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
