<!-- app/components/jobs/JobPostingCheckPanel.vue -->
<template>
  <div v-if="posting && hidden === false" class="fixed bottom-20 right-4 z-50 md:bottom-4">
    <button v-if="!open" type="button" class="h-11 rounded-full border border-border bg-background px-4 text-sm font-medium shadow-lg" @click="open = true">Markup prüfen</button>
    <div v-else class="w-80 max-h-[70vh] overflow-auto rounded-lg border border-border bg-background p-4 text-sm shadow-lg">
    <div class="flex items-start justify-between gap-3">
      <div class="grid gap-2">
        <p class="font-medium">JobPosting prüfen</p>
        <span class="w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" :class="check.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">{{ check.ok ? 'Pflichtfelder ok' : 'Pflichtfeld fehlt' }}</span>
      </div>
      <button type="button" class="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-75 hover:bg-muted hover:opacity-100" aria-label="Schließen" @click="open = false"><X class="h-4 w-4" /></button>
    </div>
    <p class="mt-3 text-sm font-medium uppercase tracking-wide opacity-75">Pflicht</p>
    <ul class="mt-1 grid gap-1">
      <li v-for="i in check.required" :key="i.key" class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :class="i.ok ? 'bg-green-600' : 'bg-red-600'" />{{ i.label }}</li>
    </ul>
    <p class="mt-3 text-sm font-medium uppercase tracking-wide opacity-75">Empfohlen</p>
    <ul class="mt-1 grid gap-1">
      <li v-for="i in check.recommended" :key="i.key" class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :class="i.ok ? 'bg-green-600' : 'bg-yellow-500'" />{{ i.label }}</li>
    </ul>
    <details class="mt-3"><summary class="cursor-pointer font-medium">JSON-LD anzeigen</summary><pre class="mt-2 max-h-60 overflow-auto rounded border border-border bg-white p-2 text-sm">{{ JSON.stringify(posting, null, 2) }}</pre></details>
    <p class="mt-3 text-sm opacity-75">Echter Test nur mit öffentlicher URL: <a class="underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">Rich-Results-Test</a></p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { checkJobPosting } from '#shared/utils/jobPostingCheck'
const query = useRoute().query
const hidden = query.markup === '0' // ?markup=0 blendet das Panel aus (Screenshots)
const open = ref(query.markup === '1')
const posting = useState<Record<string, any> | null>('jobposting:current', () => null)
const check = computed(() => checkJobPosting(posting.value ?? {}))
</script>
