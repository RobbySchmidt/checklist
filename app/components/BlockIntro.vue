<template>
  <div v-if="heading || intro" class="mb-10 max-w-2xl" :class="{ 'mx-auto text-center': center }">
    <h2 v-if="heading" :id="headingId || undefined" class="text-3xl font-semibold tracking-tight">{{ heading }}</h2>
    <p v-if="intro" class="mt-4 text-lg" :class="mutedClass(background)">{{ intro }}</p>
  </div>
</template>

<script setup lang="ts">
// Überschrift + Einleitung eines Blocks (H2 trägt die id für aria-labelledby der BlockSection)
defineProps({
  heading: { type: String, default: '' },
  intro: { type: String, default: '' },
  headingId: { type: String, default: '' },
  background: { type: String, default: 'white' },
  center: { type: Boolean, default: false },
})
</script>
