<script setup lang="ts">
// Shows /public/caleb-logo.png. Until that file exists it falls back to a
// green "CU" badge so the UI never shows a broken image.
withDefaults(defineProps<{ size?: number; withText?: boolean }>(), {
  size: 40,
  withText: true,
})
const failed = ref(false)
// Dynamic string so Vite treats it as a runtime public URL, not a build-time
// import (the file is added by the user at /public/caleb-logo.png).
const logoSrc = '/caleb-logo.png'
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-3">
    <img
      v-if="!failed"
      :src="logoSrc"
      alt="Caleb University"
      :style="{ height: size + 'px', width: 'auto' }"
      @error="failed = true"
    />
    <span
      v-else
      class="flex items-center justify-center rounded-lg bg-caleb-navy font-bold text-white"
      :style="{ height: size + 'px', width: size + 'px' }"
    >
      CU
    </span>
    <span v-if="withText" class="leading-tight">
      <span class="block text-sm font-bold text-caleb-navy">Caleb University</span>
      <span class="block text-xs text-gray-500">E-Logbook</span>
    </span>
  </NuxtLink>
</template>
