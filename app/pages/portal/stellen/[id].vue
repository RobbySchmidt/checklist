<template>
  <div class="grid gap-6">
    <div class="grid gap-2">
      <NuxtLink :to="withEmployer('/portal/stellen')" class="inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline"><ArrowLeft class="size-4" aria-hidden="true" />Zurück zu den Stellen</NuxtLink>
      <PortalPageHeader title="Stelle bearbeiten">
        <a v-if="job?.status === 'published'" :href="`/jobs/${job.slug}`" target="_blank" class="portal-btn">Auf der Website ansehen</a>
      </PortalPageHeader>
    </div>
    <PortalEmptyState v-if="error" text="Diese Stelle wurde nicht gefunden. Gehen Sie zurück zu den Stellen und wählen Sie eine andere." />
    <PortalJobForm v-if="job && me?.employer" :model-value="job" :employer="me.employer" :busy="busy" :errors="errors" :saved="saved" @submit="save" />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import type { JobInput } from '#shared/utils/jobSchema'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const id = route.params.id as string
const query = computed(() => ({ employer: route.query.employer }))
const withEmployer = (to: string) => (route.query.employer ? `${to}?employer=${route.query.employer}` : to)
const { data: me } = await useFetch<any>('/api/portal/me', { query })
const { data: job, error, refresh } = await useFetch<any>(`/api/portal/jobs/${id}`, { query })

const errors = reactive<Record<string, string>>({})
const busy = ref(false)
const saved = ref(false)

async function save(data: JobInput) {
  for (const k of Object.keys(errors)) delete errors[k]
  saved.value = false
  busy.value = true
  try {
    await $fetch(`/api/portal/jobs/${id}`, { method: 'PATCH', body: data, query: query.value })
    saved.value = true
    await refresh()
  } catch (err: any) {
    const fields = err?.data?.data
    if (err?.statusCode === 422 && fields) for (const [k, v] of Object.entries(fields)) errors[k] = (v as string[])?.[0] ?? 'Bitte prüfen.'
    else if (err?.statusCode === 409) errors.slug = 'Diesen URL-Namen gibt es schon.'
    else errors._form = 'Das hat nicht geklappt. Bitte erneut versuchen.'
  } finally {
    busy.value = false
  }
}
</script>
