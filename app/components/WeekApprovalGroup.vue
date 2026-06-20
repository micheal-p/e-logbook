<script setup lang="ts">
// One week's worth of daily entries with a single week-level approval for the
// academic supervisor. The per-day entries stay read-only (content, stamps and
// comments) — approval is done once for the whole week, not day by day.
const props = withDefaults(
  defineProps<{
    weekNumber: number
    entries: any[]
    can?: { comment?: boolean; approve?: boolean }
  }>(),
  { can: () => ({}) }
)

const client = useSupabaseClient<any>()
const uid = useUid()
const { profile } = useProfile()

// My approval row per entry id (whether stamped or not).
const myByEntry = ref<Record<number, any>>({})
const busy = ref(false)
const cardKey = ref(0) // bumped to remount EntryCards so their stamps refresh

const entryIds = computed(() => props.entries.map((e) => e.id))
const approvedCount = computed(
  () => entryIds.value.filter((id) => myByEntry.value[id]?.stamped).length
)
const weekApproved = computed(
  () => entryIds.value.length > 0 && approvedCount.value === entryIds.value.length
)

async function load() {
  if (!entryIds.value.length) return
  const { data } = await client
    .from('approvals')
    .select('id, entry_id, stamped')
    .in('entry_id', entryIds.value)
    .eq('approver_id', uid.value!)
  const map: Record<number, any> = {}
  for (const r of data ?? []) map[r.entry_id] = r
  myByEntry.value = map
}

async function approveWeek() {
  busy.value = true
  const stamped_at = new Date().toISOString()
  const toInsert: any[] = []
  for (const id of entryIds.value) {
    const mine = myByEntry.value[id]
    if (mine) {
      if (!mine.stamped) {
        const { error } = await client
          .from('approvals')
          .update({ stamped: true, stamped_at })
          .eq('id', mine.id)
        if (error) { busy.value = false; return alert(error.message) }
      }
    } else {
      toInsert.push({
        entry_id: id,
        approver_id: uid.value!,
        role: profile.value?.role,
        stamped: true,
        stamped_at,
      })
    }
  }
  if (toInsert.length) {
    const { error } = await client.from('approvals').insert(toInsert)
    if (error) { busy.value = false; return alert(error.message) }
  }
  busy.value = false
  await load()
  cardKey.value++
}

async function unapproveWeek() {
  busy.value = true
  for (const id of entryIds.value) {
    const mine = myByEntry.value[id]
    if (mine?.stamped) {
      const { error } = await client
        .from('approvals')
        .update({ stamped: false, stamped_at: null })
        .eq('id', mine.id)
      if (error) { busy.value = false; return alert(error.message) }
    }
  }
  busy.value = false
  await load()
  cardKey.value++
}

onMounted(load)
</script>

<template>
  <section class="rounded-xl border border-gray-200">
    <!-- Week header with the single week-level approval -->
    <header class="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b-2 border-caleb-navy bg-caleb-surface px-4 py-3">
      <div>
        <h2 class="font-bold text-caleb-navy">{{ weekNumber ? `Week ${weekNumber}` : 'Unscheduled' }}</h2>
        <p class="text-xs text-gray-500">{{ entries.length }} day{{ entries.length === 1 ? '' : 's' }} logged</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="weekApproved" class="pill inline-flex items-center gap-1 bg-green-100 text-green-800">
          <AppIcon name="check" :size="13" :stroke="2.5" /> Approved
        </span>
        <span v-else class="text-xs italic text-gray-400">Awaiting approval</span>

        <template v-if="can.approve">
          <button v-if="!weekApproved" class="btn-primary" :disabled="busy" @click="approveWeek">
            {{ busy ? 'Saving…' : `Approve Week ${weekNumber}` }}
          </button>
          <button v-else class="btn-outline inline-flex items-center gap-1.5" :disabled="busy" @click="unapproveWeek">
            <AppIcon name="check" :size="15" :stroke="2.5" /> Approved — undo
          </button>
        </template>
      </div>
    </header>

    <!-- Days in the week (read-only; comments allowed, no per-day approve) -->
    <div :key="cardKey" class="space-y-6 p-4">
      <EntryCard
        v-for="e in entries"
        :key="e.id"
        :entry="e"
        :feedback-can="{ comment: can.comment, approve: false }"
      />
    </div>
  </section>
</template>
