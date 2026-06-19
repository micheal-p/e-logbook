<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div>
    <NuxtLink to="/super-admin" class="text-sm text-caleb-cyan-dark hover:underline">← Back to overview</NuxtLink>
    <div class="mt-4">
      <!-- Super admin: comment + apply the final stamp (approve) on entries and summaries. -->
      <StudentLogbook :student-id="id" :can="{ comment: true, approve: true }" :show-summaries="true" />
    </div>
  </div>
</template>
