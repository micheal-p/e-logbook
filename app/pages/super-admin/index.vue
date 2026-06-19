<script setup lang="ts">
const client = useSupabaseClient<any>()

const students = ref<any[]>([])
const stats = reactive({ entries: 0, summaries: 0, approvals: 0 })
const loading = ref(true)

async function load() {
  loading.value = true
  const [p, e, s, a] = await Promise.all([
    client.from('profiles').select('*').eq('role', 'student').order('full_name'),
    client.from('entries').select('id', { count: 'exact', head: true }),
    client.from('summaries').select('id', { count: 'exact', head: true }),
    client.from('approvals').select('id', { count: 'exact', head: true }).eq('stamped', true),
  ])
  students.value = p.data ?? []
  stats.entries = e.count ?? 0
  stats.summaries = s.count ?? 0
  stats.approvals = a.count ?? 0
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">Super Admin Overview</h1>
    <p class="mb-6 text-sm text-gray-500">
      Open any student's logbook to apply the final IT stamp on entries and summaries.
    </p>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <template v-else>
      <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-navy">{{ students.length }}</p><p class="text-xs text-gray-500">Students</p></div>
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-cyan-dark">{{ stats.entries }}</p><p class="text-xs text-gray-500">Entries</p></div>
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-navy">{{ stats.summaries }}</p><p class="text-xs text-gray-500">Summaries</p></div>
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-cyan-dark">{{ stats.approvals }}</p><p class="text-xs text-gray-500">Stamps applied</p></div>
      </div>

      <div v-if="!students.length" class="card p-10 text-center text-gray-500">No students yet.</div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="s in students"
          :key="s.id"
          :to="`/super-admin/student/${s.id}`"
          class="card p-4 transition hover:border-caleb-navy hover:shadow-md"
        >
          <h3 class="font-semibold text-caleb-text">{{ s.full_name || 'Student' }}</h3>
          <p class="text-sm text-gray-500">{{ s.matric_no || '—' }} · {{ s.department || '—' }}</p>
          <span class="mt-3 inline-block text-sm font-medium text-caleb-cyan-dark">Open logbook →</span>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
