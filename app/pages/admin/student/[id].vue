<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div>
    <NuxtLink to="/admin" class="text-sm text-caleb-cyan-dark hover:underline">← Back to overview</NuxtLink>
    <div class="mt-4">
      <!-- Admin: read-only view of a student's full logbook. -->
      <StudentLogbook :student-id="id" :show-summaries="true" />
    </div>
  </div>
</template>
