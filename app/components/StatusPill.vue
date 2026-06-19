<script setup lang="ts">
const props = defineProps<{ status: string }>()
const styles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
}
const labels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
}
const cls = computed(() => styles[props.status] ?? 'bg-gray-100 text-gray-700')
const label = computed(() => labels[props.status] ?? props.status)
</script>

<template>
  <span class="pill" :class="cls">{{ label }}</span>
</template>
