<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message?: string } }>()
const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-caleb-surface px-4 text-center">
    <AppLogo :size="56" :with-text="false" />
    <h1 class="mt-6 text-4xl font-bold text-caleb-navy">{{ error.statusCode }}</h1>
    <p class="mt-2 text-gray-600">
      {{ error.statusCode === 404 ? 'Page not found.' : error.message || 'Something went wrong.' }}
    </p>
    <button class="btn-primary mt-6" @click="handleError">Go to my dashboard</button>
  </div>
</template>
