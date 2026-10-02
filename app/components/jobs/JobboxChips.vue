<!-- app/components/jobs/JobboxChips.vue -->
<template>
  <ul class="flex flex-wrap gap-2">
    <li v-for="c in chips" :key="c.label" class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" :class="variant === 'google' ? 'border border-[#dadce0] text-[#5f6368]' : 'chip-tint'">
      <component :is="c.icon" class="size-3.5 shrink-0" aria-hidden="true" />{{ c.label }}
    </li>
  </ul>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ chips: { icon: Component; label: string }[]; variant?: 'google' | 'service' }>()
</script>
