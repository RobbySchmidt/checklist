<!-- app/components/jobs/JobboxCard.vue -->
<template>
  <component :is="to ? NuxtLink : 'div'" :to="to" class="grid gap-1 rounded-lg border border-border bg-white p-4 text-left text-foreground" :class="to ? 'hover:bg-secondary/40' : 'opacity-80'">
    <p class="text-base font-semibold">{{ title }}</p>
    <p class="text-sm">{{ org }}<span v-if="logoSrc"><img :src="logoSrc" alt="" width="20" height="20" class="ml-2 inline h-5 w-5 object-contain"></span></p>
    <p class="text-sm text-muted-foreground">{{ place }}<span v-if="via"> · über {{ via }}</span></p>
    <ul class="mt-1 flex flex-wrap gap-2 text-xs">
      <li v-for="c in chips" :key="c" class="rounded-md border border-border px-2 py-1">{{ c }}</li>
    </ul>
  </component>
</template>
<script setup lang="ts">
import { NuxtLink } from '#components'
defineProps<{ title: string; org: string; place: string; chips: string[]; via?: string; to?: string; logoSrc?: string }>()
</script>
