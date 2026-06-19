<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-caleb-surface px-4 py-10">
    <div class="mb-6">
      <AppLogo :size="56" :with-text="false" />
    </div>
    <div class="card w-full max-w-md p-6 sm:p-8">
      <slot />
    </div>
    <p class="mt-6 text-center text-xs text-gray-400">
      Caleb University — SIWES Electronic Logbook
    </p>
  </div>
</template>
