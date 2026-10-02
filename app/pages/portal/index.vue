<template>
  <div class="grid gap-8">
    <PortalPageHeader :title="`Übersicht ${monthLabel}`" />
    <div v-if="error" class="portal-card p-4 opacity-75">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <template v-else-if="data">
      <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li v-for="t in tiles" :key="t.label" class="portal-card p-4">
          <p class="portal-display text-3xl md:text-4xl leading-tight">{{ t.value }}</p>
          <p class="portal-eyebrow mt-1">{{ t.label }}</p>
        </li>
      </ul>
      <section class="grid gap-3">
        <h2 class="portal-display text-xl">Wen muss ich heute anrufen?</h2>
        <PortalEmptyState v-if="!data.waiting.length" text="Alles erledigt. Es wartet niemand auf einen Rückruf." />
        <ul v-else class="grid gap-3">
          <li v-for="a in data.waiting" :key="a.id" class="portal-card grid gap-4 p-4">
            <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2 font-medium">
                  {{ a.name }}
                  <span class="rounded-full px-2.5 py-0.5 text-sm font-medium" style="background: var(--portal-paper); color: var(--portal-ink)">{{ (QUALIFICATION_LABELS as Record<string, string>)[a.qualification] ?? a.qualification }}</span>
                </p>
                <p v-if="a.job?.title" class="mt-1 text-sm opacity-75">{{ splitJobTitle(a.job.title).main }}<span v-if="splitJobTitle(a.job.title).suffix" class="ml-2">{{ splitJobTitle(a.job.title).suffix }}</span></p>
              </div>
              <p class="portal-eyebrow" :style="isOverdue(a.date_created) ? { color: 'var(--portal-neu-fg)', fontWeight: 500 } : { color: 'var(--portal-ink-soft)' }">wartet {{ waitingLabel(a.date_created) }}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:flex">
              <a :href="`tel:${a.phone}`" class="portal-btn portal-btn-primary"><Phone class="size-4" aria-hidden="true" />Anrufen</a>
              <button type="button" class="portal-btn" @click="contacted(a.id)">Kontaktiert</button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
import { QUALIFICATION_LABELS, waitingLabel, isOverdue, splitJobTitle } from '#shared/utils/jobs'
definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const { data, error, refresh } = await useFetch<any>('/api/portal/overview', { query: computed(() => ({ employer: route.query.employer })) })
const monthLabel = computed(() => data.value ? new Date(`${data.value.month}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '')
const tiles = computed(() => data.value ? [
  { label: 'Aufrufe', value: data.value.stats.views }, { label: 'Bewerbungen', value: data.value.stats.applications },
  { label: 'ohne Rückruf', value: data.value.stats.waiting }, { label: 'offene Stellen', value: data.value.stats.openJobs },
] : [])
async function contacted(id: string) {
  try {
    await $fetch(`/api/portal/applications/${id}`, { method: 'PATCH', body: { status: 'kontaktiert' }, query: { employer: route.query.employer } })
    await refresh()
  } catch (e) { console.error(e) }
}
</script>
