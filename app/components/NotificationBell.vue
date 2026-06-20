<script setup lang="ts">
const { items, unread, load, markRead, markAllRead } = useNotifications()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

// Icon per notification type.
const ICONS: Record<string, string> = {
  signoff: 'pencil',
  assignment: 'user',
  approval: 'check-circle',
  submission: 'inbox',
  schedule: 'calendar',
  completion: 'academic-cap',
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

async function onClick(n: any) {
  await markRead(n)
  open.value = false
  if (n.link) await navigateTo(n.link)
}

function toggle() {
  open.value = !open.value
  if (open.value && !items.value.length) load()
}

// Close on outside click.
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="relative rounded-lg border border-gray-300 p-2 text-caleb-text hover:bg-caleb-surface"
      aria-label="Notifications"
      @click="toggle"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span
        v-if="unread"
        class="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute right-0 z-30 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
    >
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <p class="text-sm font-semibold">Notifications</p>
        <button
          v-if="unread"
          class="text-xs text-caleb-cyan-dark hover:underline"
          @click="markAllRead"
        >
          Mark all read
        </button>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <p v-if="!items.length" class="px-4 py-8 text-center text-sm text-gray-400">
          You're all caught up.
        </p>
        <button
          v-for="n in items"
          :key="n.id"
          class="flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-caleb-surface"
          :class="!n.read ? 'bg-caleb-surface/60' : ''"
          @click="onClick(n)"
        >
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-caleb-surface text-caleb-navy">
            <AppIcon :name="ICONS[n.type] || 'bell'" :size="16" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span class="truncate text-sm font-semibold text-caleb-navy">{{ n.title }}</span>
              <span v-if="!n.read" class="h-2 w-2 shrink-0 rounded-full bg-caleb-cyan-dark"></span>
            </span>
            <span class="block text-xs text-gray-600">{{ n.body }}</span>
            <span class="mt-0.5 block text-[11px] text-gray-400">{{ timeAgo(n.created_at) }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
