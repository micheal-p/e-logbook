<script setup lang="ts">
const link = ref('')
const generating = ref(false)
const copied = ref(false)

async function generateLink() {
  generating.value = true
  try {
    const { token } = await $fetch<{ token: string }>('/api/share/create', { method: 'POST' })
    link.value = `${window.location.origin}/sign/${token}`
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Could not generate link')
  } finally {
    generating.value = false
  }
}
function copyLink() {
  navigator.clipboard?.writeText(link.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
const mailto = computed(
  () =>
    `mailto:?subject=${encodeURIComponent('SIWES logbook sign-off')}&body=${encodeURIComponent(
      'Please review and sign my SIWES logbook here: ' + link.value
    )}`
)
</script>

<template>
  <div>
    <!-- Passport, supervisors, SIWES countdown, delete account -->
    <StudentStatus />

    <!-- Work-supervisor sign-off link -->
    <div class="card mb-6 p-4">
      <h2 class="font-semibold text-caleb-navy">Work supervisor sign-off</h2>
      <p class="mb-3 mt-1 text-sm text-gray-500">
        Generate a link and send it to your company/work supervisor. They can review your completed
        weeks and sign them — no account needed.
      </p>
      <button v-if="!link" class="btn-secondary" :disabled="generating" @click="generateLink">
        {{ generating ? 'Generating…' : 'Generate sign-off link' }}
      </button>
      <div v-else class="flex flex-wrap items-center gap-2">
        <input :value="link" readonly class="field max-w-md" @focus="($event.target as HTMLInputElement).select()" />
        <button class="btn-outline" @click="copyLink">{{ copied ? 'Copied!' : 'Copy' }}</button>
        <a class="btn-secondary" :href="mailto">Email it</a>
      </div>
    </div>

    <h1 class="mb-1 text-2xl font-bold text-caleb-text">My Logbook</h1>
    <p class="mb-4 text-sm text-gray-500">Fill in each weekday. Complete a week to unlock the next.</p>

    <WeekLogbook />
  </div>
</template>
