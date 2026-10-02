<template>
  <div class="min-h-screen bg-primary flex items-center">
    <div class="w-full">
      <div class="bg-black text-white p-8 max-w-2xl">
        <h1 class="text-f-4xl font-semibold mb-6">
          {{ title }}
        </h1>
        <p class="text-f-xl font-light mb-10">
          {{ text }}
        </p>
        <button
          type="button"
          @click="handleClearError"
          class="inline-flex items-center gap-2 bg-primary text-black rounded-full px-6 py-3 cursor-pointer group">
          <span>{{ isJob404 ? 'Offene Stellen' : 'Zur Startseite' }}</span>
          <MoveRight class="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app'
  import { MoveRight } from 'lucide-vue-next'

  const props = defineProps({
    error: Object as () => NuxtError,
  })

  // 404 unter /jobs/… heißt: Stelle nicht (mehr) sichtbar, Link zurück auf die Liste
  const isJob404 = computed(() => props.error?.statusCode === 404 && useRoute().path.startsWith('/jobs'))
  const is503 = computed(() => props.error?.statusCode === 503)
  const title = computed(() => isJob404.value ? 'Diese Stelle ist nicht mehr verfügbar'
    : is503.value ? 'Gerade nicht erreichbar'
    : props.error?.statusCode === 404 ? 'Seite nicht gefunden' : 'Da ist etwas schiefgelaufen')
  const text = computed(() => isJob404.value ? 'Vielleicht ist sie schon besetzt. Alle offenen Stellen finden Sie auf der Übersicht.'
    : is503.value ? 'Bitte versuchen Sie es in ein paar Minuten noch einmal.'
    : props.error?.statusCode === 404 ? 'Diese Seite konnten wir leider nicht finden. Probieren Sie es über unsere Startseite.'
    : 'Bitte versuchen Sie es später noch einmal.')
  const handleClearError = () => clearError({ redirect: isJob404.value ? '/jobs' : '/' })
</script>
