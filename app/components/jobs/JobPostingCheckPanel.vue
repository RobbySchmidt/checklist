<!-- app/components/jobs/JobPostingCheckPanel.vue -->
<template>
  <div v-if="posting" class="fixed bottom-4 right-4 z-50 w-80 max-h-[70vh] overflow-auto rounded-xl border border-border bg-background p-4 text-sm shadow-lg">
    <div class="flex items-center justify-between">
      <p class="font-bold">JobPosting prüfen</p>
      <span class="rounded-full px-2 py-0.5 text-xs font-bold" :class="check.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">{{ check.ok ? 'Pflichtfelder ok' : 'Pflichtfeld fehlt' }}</span>
    </div>
    <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pflicht</p>
    <ul class="mt-1 grid gap-1">
      <li v-for="i in check.required" :key="i.key" class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :class="i.ok ? 'bg-green-600' : 'bg-red-600'" />{{ i.label }}</li>
    </ul>
    <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empfohlen</p>
    <ul class="mt-1 grid gap-1">
      <li v-for="i in check.recommended" :key="i.key" class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :class="i.ok ? 'bg-green-600' : 'bg-yellow-500'" />{{ i.label }}</li>
    </ul>
    <details class="mt-3"><summary class="cursor-pointer font-semibold">JSON-LD anzeigen</summary><pre class="mt-2 max-h-60 overflow-auto rounded bg-secondary p-2 text-xs">{{ JSON.stringify(posting, null, 2) }}</pre></details>
    <p class="mt-3 text-xs text-muted-foreground">Echter Test nur mit öffentlicher URL: <a class="underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">Rich-Results-Test</a></p>
  </div>
</template>
<script setup lang="ts">
import { checkJobPosting } from '#shared/utils/jobPostingCheck'
const posting = useState<Record<string, any> | null>('jobposting:current', () => null)
const check = computed(() => checkJobPosting(posting.value ?? {}))
</script>
