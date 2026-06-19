<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <div>
    <NuxtLink to="/supervisor" class="text-sm text-caleb-cyan-dark hover:underline">← Back to my students</NuxtLink>
    <div class="mt-4">
      <!-- Academic supervisor: reads everything, comments, approves, and grades. -->
      <StudentLogbook :student-id="id" :can="{ comment: true, approve: true, grade: true }" :show-summaries="true" />
    </div>
  </div>
</template>
