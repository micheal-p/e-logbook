<script setup lang="ts">
// Monthly summaries now live inline in the logbook (one appears after every
// 4-week block). This old standalone page just redirects there.
onMounted(() => navigateTo('/student', { replace: true }))
</script>

<template>
  <div class="py-12 text-center text-sm text-gray-400">Redirecting to your logbook…</div>
</template>
