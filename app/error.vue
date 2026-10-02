<template>
  <div class="min-h-screen bg-primary flex items-center">
    <div class="w-full">
      <div class="bg-black text-white p-8 max-w-2xl">
        <h1 class="text-f-4xl font-semibold mb-6">
          {{ error?.statusCode }} – Seite nicht gefunden
        </h1>
        <p class="text-f-xl font-light mb-10">
          Diese Seite konnten wir leider nicht finden. Probieren Sie es über unsere Startseite.
        </p>
        <button
          type="button"
          @click="handleClearError"
          class="inline-flex items-center gap-2 bg-primary text-black rounded-full px-6 py-3 cursor-pointer group">
          <span>Zur Startseite</span>
          <MoveRight class="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app'
  import { MoveRight } from 'lucide-vue-next'

  defineProps({
    error: Object as () => NuxtError,
  })

  const handleClearError = () => clearError({ redirect: '/' })
</script>
