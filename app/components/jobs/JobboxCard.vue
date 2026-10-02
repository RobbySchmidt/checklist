<!-- app/components/jobs/JobboxCard.vue -->
<template>
  <button type="button" class="grid w-full gap-1 border-l-[3px] px-4 py-4 text-left" :class="active ? 'border-l-[#1a73e8] bg-[#e8f0fe]' : 'border-l-transparent hover:bg-[#f8f9fa]'" :aria-current="active || undefined" @click="$emit('select')">
    <span class="text-base font-medium text-[#202124]">{{ title }}</span>
    <span class="flex items-center gap-2 text-sm text-[#5f6368]">{{ org }}<img v-if="logoSrc" :src="logoSrc" alt="" width="20" height="20" class="h-5 w-5 object-contain"></span>
    <span class="text-sm text-[#5f6368]">{{ place }}<template v-if="via"> · über {{ via }}</template></span>
    <JobsJobboxChips :chips="chips" class="mt-2" />
  </button>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ title: string; org: string; place: string; chips: { icon: Component; label: string }[]; via?: string; logoSrc?: string; active?: boolean }>()
defineEmits<{ select: [] }>()
</script>
