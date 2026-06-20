<script setup lang="ts">
// Printable SIWES logbook report for one of the supervisor's students.
// layout:false so there's no dashboard chrome; the global role middleware keeps
// this under /supervisor, and RLS limits reads to assigned students.
definePageMeta({ layout: false })
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <LogbookReport :student-id="id" :back-to="`/supervisor/student/${id}`" back-label="← Back to student" />
</template>
