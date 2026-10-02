<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-center gap-3">
      <NuxtLink :to="withEmployer('/portal/stellen')" class="text-sm underline">Zurück zu den Stellen</NuxtLink>
      <h1 class="text-2xl font-bold">Stelle bearbeiten</h1>
      <a v-if="job?.status === 'published'" :href="`/jobs/${job.slug}`" target="_blank" class="text-sm underline">Auf der Website ansehen</a>
    </div>
    <p v-if="error" class="rounded-xl border border-border p-4 text-muted-foreground">Diese Stelle wurde nicht gefunden.</p>
    <p v-if="saved" class="rounded-lg bg-secondary p-3" role="status">Gespeichert</p>
    <PortalJobForm v-if="job && me?.employer" :model-value="job" :employer="me.employer" :busy="busy" :errors="errors" @submit="save" />
  </div>
</template>

<script setup lang="ts">
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
