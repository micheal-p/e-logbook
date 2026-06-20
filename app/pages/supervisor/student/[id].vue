<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <NuxtLink to="/supervisor" class="text-sm text-caleb-cyan-dark hover:underline">← Back to my students</NuxtLink>
      <NuxtLink :to="`/supervisor/report/${id}`" target="_blank" class="btn-secondary inline-flex items-center gap-1.5">
        <AppIcon name="document" :size="16" /> Download report (PDF)
      </NuxtLink>
    </div>
    <div class="mt-4">
      <!-- Final SIWES sign-off (once the student uploads their stamped report). -->
      <CompletionApproval :student-id="id" />
      <!-- Academic supervisor: reads everything, comments, and approves. -->
      <StudentLogbook :student-id="id" :can="{ comment: true, approve: true }" :show-summaries="true" />
    </div>
  </div>
</template>
