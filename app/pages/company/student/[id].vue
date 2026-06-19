<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div>
    <NuxtLink to="/company" class="text-sm text-caleb-cyan-dark hover:underline">← Back to my students</NuxtLink>
    <div class="mt-4">
      <!-- Company supervisor: approves daily tasks + comments. No summaries, no grading. -->
      <StudentLogbook :student-id="id" :can="{ comment: true, approve: true }" :show-summaries="false" />
    </div>
  </div>
</template>
