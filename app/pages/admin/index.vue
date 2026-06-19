<script setup lang="ts">
const client = useSupabaseClient<any>()

const profiles = ref<any[]>([])
const assignments = ref<any[]>([])
const entryCounts = ref<Record<string, number>>({})
const loading = ref(true)

const ROLES = ['student', 'company_supervisor', 'supervisor', 'admin', 'super_admin']

async function load() {
  loading.value = true
  const [p, a, e] = await Promise.all([
    client.from('profiles').select('*').order('created_at', { ascending: true }),
    client
      .from('assignments')
      .select(
        '*, supervisor:profiles!assignments_supervisor_id_fkey(full_name), company:profiles!assignments_company_supervisor_id_fkey(full_name)'
      ),
    client.from('entries').select('student_id'),
  ])
  profiles.value = p.data ?? []
  assignments.value = a.data ?? []
  const counts: Record<string, number> = {}
  for (const row of e.data ?? []) counts[row.student_id] = (counts[row.student_id] ?? 0) + 1
  entryCounts.value = counts
  loading.value = false
}

const students = computed(() => profiles.value.filter((p) => p.role === 'student'))
const supervisors = computed(() =>
  profiles.value.filter((p) => p.role === 'supervisor' || p.role === 'company_supervisor')
)
function assignmentFor(studentId: string) {
  return assignments.value.find((a) => a.student_id === studentId)
}

async function changeRole(profile: any, role: string) {
  if (role === profile.role) return
  if (!confirm(`Change ${profile.full_name || profile.email} to ${ROLE_LABELS[role]}?`)) {
    return load() // reset the select
  }
  const { error } = await client.from('profiles').update({ role }).eq('id', profile.id)
  if (error) alert(error.message)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="mb-1 text-2xl font-bold text-caleb-text">Overview</h1>
    <p class="mb-6 text-sm text-gray-500">All students and supervisors at a glance.</p>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Loading…</div>

    <template v-else>
      <!-- Stats -->
      <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-navy">{{ students.length }}</p><p class="text-xs text-gray-500">Students</p></div>
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-cyan-dark">{{ supervisors.length }}</p><p class="text-xs text-gray-500">Supervisors</p></div>
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-navy">{{ assignments.length }}</p><p class="text-xs text-gray-500">Assigned</p></div>
        <div class="card p-4"><p class="text-2xl font-bold text-caleb-cyan-dark">{{ students.length - assignments.length }}</p><p class="text-xs text-gray-500">Unassigned</p></div>
      </div>

      <!-- Students -->
      <section class="mb-10">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Students</h2>
          <NuxtLink to="/admin/assign" class="btn-primary">Assign students</NuxtLink>
        </div>
        <div class="card overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-caleb-surface text-left text-xs uppercase text-gray-500">
              <tr>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Matric</th>
                <th class="px-4 py-2">Dept</th>
                <th class="px-4 py-2">Entries</th>
                <th class="px-4 py-2">Academic Sup.</th>
                <th class="px-4 py-2">Company Sup.</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="s in students" :key="s.id">
                <td class="px-4 py-2 font-medium">{{ s.full_name || '—' }}</td>
                <td class="px-4 py-2">{{ s.matric_no || '—' }}</td>
                <td class="px-4 py-2">{{ s.department || '—' }}</td>
                <td class="px-4 py-2">{{ entryCounts[s.id] || 0 }}</td>
                <td class="px-4 py-2">
                  <span :class="assignmentFor(s.id)?.supervisor ? '' : 'text-amber-600'">
                    {{ assignmentFor(s.id)?.supervisor?.full_name || 'Unassigned' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <span :class="assignmentFor(s.id)?.company ? '' : 'text-amber-600'">
                    {{ assignmentFor(s.id)?.company?.full_name || 'Unassigned' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <NuxtLink :to="`/admin/student/${s.id}`" class="text-caleb-cyan-dark hover:underline">View</NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- All users / role management -->
      <section>
        <h2 class="mb-3 text-lg font-semibold">All users &amp; roles</h2>
        <p class="mb-3 text-sm text-gray-500">
          Promote a signed-up user to supervisor / company supervisor / admin here.
        </p>
        <div class="card overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-caleb-surface text-left text-xs uppercase text-gray-500">
              <tr>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Email</th>
                <th class="px-4 py-2">Role</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="u in profiles" :key="u.id">
                <td class="px-4 py-2 font-medium">{{ u.full_name || '—' }}</td>
                <td class="px-4 py-2">{{ u.email }}</td>
                <td class="px-4 py-2">
                  <select
                    class="field w-48"
                    :value="u.role"
                    @change="changeRole(u, ($event.target as HTMLSelectElement).value)"
                  >
                    <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABELS[r] }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
