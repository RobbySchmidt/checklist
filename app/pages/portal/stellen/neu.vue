<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-center gap-3">
      <NuxtLink :to="withEmployer('/portal/stellen')" class="text-sm underline">Zurück zu den Stellen</NuxtLink>
      <h1 class="text-2xl font-bold">Neue Stelle</h1>
    </div>
    <PortalJobForm v-if="me?.employer" :model-value="defaults" :employer="me.employer" :busy="busy" :errors="errors" @submit="save" />
  </div>
</template>

<script setup lang="ts">
import type { JobInput } from '#shared/utils/jobSchema'
import { toIsoDate } from '#shared/utils/jobs'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const query = computed(() => ({ employer: route.query.employer }))
const withEmployer = (to: string) => (route.query.employer ? `${to}?employer=${route.query.employer}` : to)
const { data: me } = await useFetch<any>('/api/portal/me', { query })

const today = new Date()
const defaults: Partial<JobInput> = {
  status: 'draft', date_posted: toIsoDate(today), valid_through: toIsoDate(new Date(today.getTime() + 60 * 86400000)),
  salary_unit: 'MONTH', employment_types: ['FULL_TIME'],
}
const errors = reactive<Record<string, string>>({})
const busy = ref(false)

async function save(data: JobInput) {
  for (const k of Object.keys(errors)) delete errors[k]
  busy.value = true
  try {
    const res = await $fetch<{ id: string }>('/api/portal/jobs', { method: 'POST', body: data, query: query.value })
    await navigateTo(withEmployer(`/portal/stellen/${res.id}`))
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
