<template>
  <div class="grid gap-8">
    <h1 class="text-2xl font-bold">Übersicht {{ monthLabel }}</h1>
    <div v-if="error" class="rounded-xl border border-border p-4 text-muted-foreground">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <template v-else-if="data">
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="t in tiles" :key="t.label" class="rounded-xl border border-border p-4"><p class="text-3xl font-extrabold tabular-nums">{{ t.value }}</p><p class="text-sm text-muted-foreground">{{ t.label }}</p></li>
      </ul>
      <section class="grid gap-3">
        <h2 class="text-xl font-bold">Wartet auf Rückruf</h2>
        <p v-if="!data.waiting.length" class="text-muted-foreground">Alles erledigt. Keine offenen Bewerbungen.</p>
        <ul v-else class="grid gap-2">
          <li v-for="a in data.waiting" :key="a.id" class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
            <div class="min-w-0 flex-1"><p class="font-semibold">{{ a.name }} <span class="font-normal text-muted-foreground">· {{ (QUALIFICATION_LABELS as Record<string, string>)[a.qualification] ?? a.qualification }}</span></p><p class="text-sm text-muted-foreground">{{ a.job?.title }} · seit {{ since(a.date_created) }}</p></div>
            <a :href="`tel:${a.phone}`" class="h-10 inline-flex items-center rounded-full border border-border px-4 font-semibold">{{ a.phone }}</a>
            <button type="button" class="h-10 rounded-full bg-primary px-4 font-semibold text-primary-foreground" @click="contacted(a.id)">Kontaktiert</button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
<script setup lang="ts">
import { QUALIFICATION_LABELS } from '#shared/utils/jobs'
definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const { data, error, refresh } = await useFetch<any>('/api/portal/overview', { query: computed(() => ({ employer: route.query.employer })) })
const monthLabel = computed(() => data.value ? new Date(`${data.value.month}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '')
const tiles = computed(() => data.value ? [
  { label: 'Aufrufe', value: data.value.stats.views }, { label: 'Bewerbungen', value: data.value.stats.applications },
  { label: 'ohne Rückruf', value: data.value.stats.waiting }, { label: 'offene Stellen', value: data.value.stats.openJobs },
] : [])
const since = (iso: string) => { const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000); return h < 48 ? `${h} Std.` : `${Math.round(h / 24)} Tagen` }
async function contacted(id: string) {
  try {
    await $fetch(`/api/portal/applications/${id}`, { method: 'PATCH', body: { status: 'kontaktiert' }, query: { employer: route.query.employer } })
    await refresh()
  } catch (e) { console.error(e) }
}
</script>
