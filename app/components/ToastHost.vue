<script setup lang="ts">
// Renders transient toast popups (bottom-right). Fed by useToast().push().
const { toasts, dismiss } = useToast()

async function go(t: any) {
  dismiss(t.id)
  if (t.link) await navigateTo(t.link)
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[90vw] flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
      >
        <div class="flex items-start gap-3 p-3">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-caleb-navy text-sm text-white">🔔</span>
          <button class="min-w-0 flex-1 text-left" @click="go(t)">
            <p class="truncate text-sm font-semibold text-caleb-navy">{{ t.title }}</p>
            <p v-if="t.body" class="text-xs text-gray-600">{{ t.body }}</p>
          </button>
          <button class="text-gray-400 hover:text-gray-600" aria-label="Dismiss" @click="dismiss(t.id)">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-width="2" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        <div class="h-0.5 w-full bg-caleb-cyan-dark/70"></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
