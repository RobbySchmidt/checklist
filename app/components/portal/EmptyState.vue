<template>
  <div class="grid justify-items-start gap-4">
    <p class="text-base" style="color: var(--portal-ink)">{{ text }}</p>
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ text: string }>()
</script>
