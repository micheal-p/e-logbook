<script setup lang="ts">
// Lists the students assigned to the current supervisor and links to each
// student's logbook. `column` selects which supervisor slot to match.
const props = defineProps<{
  column: 'supervisor_id' | 'company_supervisor_id'
  basePath: string // e.g. '/company' or '/supervisor'
}>()

const client = useSupabaseClient<any>()
const uid = useUid()
const rows = ref<any[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data } = await client
    .from('assignments')
    .select('*, student:profiles!assignments_student_id_fkey(*)')
    .eq(props.column, uid.value!)
  const list = (data ?? []).filter((r) => r.student)

  // Lightweight progress info per student.
  await Promise.all(
    list.map(async (r) => {
      const { count } = await client
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', r.student.id)
      r.entry_count = count ?? 0
    })
  )
  rows.value = list
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading students…</div>

    <div v-else-if="!rows.length" class="card p-10 text-center text-gray-500">
      No students assigned to you yet. The admin assigns students to supervisors.
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="r in rows"
        :key="r.id"
        :to="`${basePath}/student/${r.student.id}`"
        class="card p-4 transition hover:border-caleb-navy hover:shadow-md"
      >
        <h3 class="font-semibold text-caleb-text">{{ r.student.full_name || 'Student' }}</h3>
        <p class="text-sm text-gray-500">{{ r.student.matric_no || '—' }} · {{ r.student.department || '—' }}</p>
        <p class="mt-2 text-xs text-gray-400">{{ r.entry_count }} entr{{ r.entry_count === 1 ? 'y' : 'ies' }}</p>
        <span class="mt-3 inline-block text-sm font-medium text-caleb-cyan-dark">Open logbook →</span>
      </NuxtLink>
    </div>
  </div>
</template>
