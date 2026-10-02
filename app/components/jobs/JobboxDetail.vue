<!-- app/components/jobs/JobboxDetail.vue -->
<template>
  <article class="grid gap-4 p-5 text-[#202124]">
    <div class="grid gap-1">
      <h2 class="text-[22px] leading-snug font-normal">{{ title }}</h2>
      <p class="text-sm text-[#5f6368]">{{ org }} · {{ place }}</p>
    </div>
    <JobsJobboxChips :chips="chips" />
    <a v-if="to" :href="to" target="_blank" rel="noopener" class="inline-flex h-10 w-fit items-center rounded-full bg-[#1a73e8] px-6 text-sm font-medium text-white hover:bg-[#1765cc]">Bewerben auf {{ orgName }}</a>
    <template v-if="job">
      <div class="grid gap-3 border-t border-[#dadce0] pt-4">
        <h3 class="text-base font-medium">Stellenbeschreibung</h3>
        <p v-if="job.intro" class="text-sm">{{ job.intro }}</p>
        <div v-if="job.tasks" class="jb-html text-sm" v-html="sanitizeHtml(job.tasks)" />
        <div v-if="job.requirements" class="jb-html text-sm" v-html="sanitizeHtml(job.requirements)" />
      </div>
      <p class="text-sm text-[#5f6368]">Veröffentlicht: {{ published }}</p>
    </template>
    <p v-else class="text-sm text-[#5f6368]">Fiktiver Vergleichseintrag, ohne Beschreibung.</p>
  </article>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{ title: string; org: string; orgName?: string; place: string; chips: { icon: Component; label: string }[]; to?: string; job?: any; published?: string }>()
</script>
<style scoped>
.jb-html :deep(ul) { list-style: disc; padding-left: 1.25rem; }
.jb-html :deep(ol) { list-style: decimal; padding-left: 1.25rem; }
.jb-html :deep(p), .jb-html :deep(li) { margin-bottom: 0.25rem; }
</style>
