<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <h1 class="portal-display text-3xl leading-tight md:text-4xl">{{ title }}</h1>
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ title: string }>()
</script>
