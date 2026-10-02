<template>
  <header class="grid gap-4">
    <div class="flex items-center gap-3">
      <img v-if="logoSrc" :src="logoSrc" :alt="employer.name" width="56" height="56" class="h-14 w-14 rounded-lg object-contain bg-white">
      <p class="text-sm font-medium opacity-75">{{ employer.name }}</p>
    </div>
    <h1 :id="headingId" class="text-3xl md:text-4xl leading-tight font-medium tracking-tight text-balance">{{ splitJobTitle(job.title).main }}<span v-if="splitJobTitle(job.title).suffix" class="ml-2 text-sm font-normal opacity-75">{{ splitJobTitle(job.title).suffix }}</span></h1>
    <ul class="flex flex-wrap gap-2 text-sm font-medium">
      <li v-for="t in job.employment_types ?? []" :key="t" class="rounded-full bg-secondary px-3 py-1">{{ EMPLOYMENT_TYPE_LABELS[t] }}</li>
      <li v-if="hours" class="rounded-full bg-secondary px-3 py-1">{{ hours }}</li>
      <li v-if="job.start_note" class="rounded-full bg-secondary px-3 py-1">{{ job.start_note }}</li>
    </ul>
    <p class="opacity-75">{{ location.street }}, {{ location.zip }} {{ location.city }}<span v-if="employer.service_area"> · Einsatz: {{ employer.service_area }}</span></p>
    <div v-if="salary" class="rounded-lg bg-primary px-5 py-4 text-primary-foreground">
      <p class="text-3xl md:text-4xl leading-tight font-medium">{{ salary }}</p>
      <p v-if="job.salary_note" class="text-sm opacity-90">{{ job.salary_note }}</p>
    </div>
  </header>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText, splitJobTitle } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer; headingId: string }>()
const { public: pub } = useRuntimeConfig()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hours = computed(() => props.job.hours_min || props.job.hours_max
  ? (props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche` : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
  : '')
const logoSrc = computed(() => {
  const logo = props.employer.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}?width=112&height=112&fit=contain&format=auto` : ''
})
</script>
