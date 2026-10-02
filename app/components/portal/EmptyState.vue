<template>
  <div class="portal-card grid justify-items-start gap-4 p-5">
    <p class="text-base" style="color: var(--portal-text)">{{ text }}</p>
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{ text: string }>()
</script>
