<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="portal-display text-2xl md:text-3xl">{{ title }}</h1>
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ title: string }>()
</script>
