<template>
  <div class="space-y-10">
    <PortalPageHeader :title="`Übersicht ${monthLabel}`" />
    <p v-if="error" class="opacity-75">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</p>
    <template v-else-if="data">
      <ul class="grid grid-cols-2 gap-8 md:grid-cols-4">
        <li v-for="t in tiles" :key="t.label" class="md:border-l md:pl-6 md:first:border-l-0 md:first:pl-0">
          <p class="portal-display text-3xl leading-tight md:text-4xl">{{ t.value }}</p>
          <p class="mt-1 text-sm opacity-75">{{ t.label }}</p>
        </li>
      </ul>
      <section class="space-y-4">
        <h2 class="portal-display text-xl leading-tight">Wen muss ich heute anrufen?</h2>
        <PortalEmptyState v-if="!data.waiting.length" text="Alles erledigt. Es wartet niemand auf einen Rückruf." />
        <ul v-else class="divide-y">
          <li v-for="a in data.waiting" :key="a.id" class="py-6 first:pt-2">
            <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <div class="min-w-0">
                <p class="font-medium">
                  {{ a.name }}
                  <span class="ml-2 text-sm font-normal opacity-75">{{ (QUALIFICATION_LABELS as Record<string, string>)[a.qualification] ?? a.qualification }}</span>
                </p>
                <p class="mt-1 text-sm opacity-75">{{ a.job?.title }}</p>
              </div>
              <p class="text-sm" :class="isOverdue(a.date_created) ? 'font-medium' : 'opacity-75'" :style="isOverdue(a.date_created) ? { color: 'var(--portal-neu-fg)' } : {}">wartet {{ waitingLabel(a.date_created) }}</p>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 sm:flex">
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
import { QUALIFICATION_LABELS, waitingLabel, isOverdue } from '#shared/utils/jobs'
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
