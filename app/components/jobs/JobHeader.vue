<template>
  <header class="space-y-4">
    <div class="flex items-center gap-3">
      <img v-if="logoSrc" :src="logoSrc" :alt="employer.name" width="56" height="56" class="h-14 w-14 rounded-lg object-contain bg-white">
      <p class="text-sm opacity-75">{{ employer.name }}</p>
    </div>
    <h1 :id="headingId" class="text-3xl font-medium leading-tight text-balance md:text-4xl">
      {{ titleMain }}<span v-if="titleSuffix" class="ml-2 text-sm font-normal opacity-75">{{ titleSuffix }}</span>
    </h1>
    <p v-if="facts" class="text-base">{{ facts }}</p>
    <p class="text-sm opacity-75">{{ location.street }}, {{ location.zip }} {{ location.city }}<span v-if="employer.service_area"> · Einsatz: {{ employer.service_area }}</span></p>
    <div v-if="salary" class="rounded-lg bg-primary px-5 py-4 text-primary-foreground">
      <p class="text-3xl font-medium leading-tight md:text-4xl">{{ salary }}</p>
      <p v-if="job.salary_note" class="mt-1 text-sm opacity-75">{{ job.salary_note }}</p>
    </div>
  </header>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer; headingId: string }>()
const { public: pub } = useRuntimeConfig()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const GENDER_SUFFIX = /\s*\((m\/w\/d|w\/m\/d|d\/m\/w)\)/
const titleMain = computed(() => props.job.title.replace(GENDER_SUFFIX, '').trim())
const titleSuffix = computed(() => props.job.title.match(GENDER_SUFFIX)?.[0].trim() ?? '')
const hours = computed(() => props.job.hours_min || props.job.hours_max
  ? (props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche` : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
  : '')
const facts = computed(() => [
  ...(props.job.employment_types ?? []).map((t) => EMPLOYMENT_TYPE_LABELS[t]),
  hours.value,
  props.job.start_note,
].filter(Boolean).join(' · '))
const logoSrc = computed(() => {
  const logo = props.employer.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}?width=112&height=112&fit=contain&format=auto` : ''
})
</script>
