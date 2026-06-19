<script setup lang="ts">
// The student's own printable logbook report. layout:false for clean printing;
// RLS restricts the data to the signed-in student's own records.
definePageMeta({ layout: false })
const uid = useUid()
</script>

<template>
  <LogbookReport v-if="uid" :student-id="uid" back-to="/student" back-label="← Back to my logbook" />
</template>
