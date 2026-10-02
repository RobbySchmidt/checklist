<template>
  <NuxtLink :to="jobPath(job.slug)" class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div class="min-w-0">
      <h2 class="text-xl font-medium leading-tight text-balance">{{ job.title }}</h2>
      <p class="mt-1 text-sm opacity-75">{{ facts }}</p>
      <p class="mt-1 text-sm opacity-75">{{ location.zip }} {{ location.city }}</p>
    </div>
    <p v-if="salary" class="shrink-0 font-medium">{{ salary }}</p>
  </NuxtLink>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, jobPath, salaryText } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hoursLabel = computed(() => props.job.hours_min || props.job.hours_max
  ? (props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max
    ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche`
    : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
  : '')
const facts = computed(() => [
  ...(props.job.employment_types ?? []).map((t) => EMPLOYMENT_TYPE_LABELS[t]),
  hoursLabel.value,
  props.job.start_note,
].filter(Boolean).join(' · '))
</script>
