<script setup lang="ts">
// One daily entry rendered like a logbook page.
defineProps<{
  entry: any
  canEdit?: boolean
  feedbackCan?: { comment?: boolean; approve?: boolean }
}>()
const emit = defineEmits<{ edit: [entry: any]; delete: [entry: any] }>()

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <article class="card overflow-hidden">
    <!-- Page header -->
    <header class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-caleb-navy bg-caleb-surface px-4 py-3">
      <div>
        <h3 class="font-semibold text-caleb-text">{{ fmtDate(entry.entry_date) }}</h3>
        <p v-if="entry.week_number" class="text-xs text-gray-500">Week {{ entry.week_number }}</p>
      </div>
      <div class="flex items-center gap-2">
        <StatusPill :status="entry.status" />
        <template v-if="canEdit">
          <button class="text-sm text-caleb-cyan-dark hover:underline" @click="emit('edit', entry)">
            Edit
          </button>
          <button class="text-sm text-red-600 hover:underline" @click="emit('delete', entry)">
            Delete
          </button>
        </template>
      </div>
    </header>

    <!-- Body -->
    <div class="space-y-4 px-4 py-4">
      <p class="logbook-lines whitespace-pre-wrap text-[15px] text-caleb-text">{{ entry.content }}</p>

      <div v-if="entry.media_url">
        <a :href="entry.media_url" target="_blank" rel="noopener">
          <img :src="entry.media_url" class="max-h-72 rounded-lg border" alt="entry attachment" />
        </a>
      </div>

      <!-- Signature / approval strip -->
      <EntryFeedback :entry-id="entry.id" :can="feedbackCan" />
    </div>
  </article>
</template>
