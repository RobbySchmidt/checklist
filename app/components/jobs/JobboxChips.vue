<!-- app/components/jobs/JobboxChips.vue -->
<template>
  <ul class="flex flex-wrap gap-2">
    <li v-for="c in chips" :key="c.label" class="inline-flex items-center gap-1 rounded-full border border-[#dadce0] px-2.5 py-1 text-xs text-[#5f6368]">
      <component :is="c.icon" class="size-3.5 shrink-0" aria-hidden="true" />{{ c.label }}
    </li>
  </ul>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ chips: { icon: Component; label: string }[] }>()
</script>
