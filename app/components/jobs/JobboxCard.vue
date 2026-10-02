<!-- app/components/jobs/JobboxCard.vue -->
<template>
  <component :is="to ? NuxtLink : 'div'" :to="to" class="grid gap-1 px-5 py-4 text-left text-foreground" :class="to ? 'hover:bg-secondary/40' : 'opacity-75'">
    <p class="text-base" :class="to ? 'font-medium' : ''">{{ title }}</p>
    <p class="text-sm">{{ org }}<span v-if="logoSrc"><img :src="logoSrc" alt="" width="20" height="20" class="ml-2 inline h-5 w-5 object-contain"></span></p>
    <p class="text-sm" :class="to ? 'opacity-75' : ''">{{ place }}<span v-if="via"> · über {{ via }}</span></p>
    <p class="text-sm" :class="to ? 'opacity-75' : ''">{{ chips.join(' · ') }}</p>
  </component>
</template>
<script setup lang="ts">
import { NuxtLink } from '#components'
defineProps<{ title: string; org: string; place: string; chips: string[]; via?: string; to?: string; logoSrc?: string }>()
</script>
