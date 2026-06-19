<script setup lang="ts">
// Printable SIWES logbook report for one student. layout:false so there's no
// dashboard chrome; the global role middleware still restricts this to admins.
definePageMeta({ layout: false })
const route = useRoute()
const id = route.params.id as string
</script>

<template>
  <LogbookReport :student-id="id" back-to="/admin" back-label="← Back to overview" />
</template>
