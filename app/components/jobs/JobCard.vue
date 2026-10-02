<template>
  <NuxtLink :to="jobPath(job.slug)" class="block rounded-xl border border-border bg-background p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <h2 class="text-xl font-bold text-balance">{{ job.title }}</h2>
    <ul class="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
      <li v-for="t in job.employment_types ?? []" :key="t" class="rounded-full bg-secondary px-3 py-1">{{ EMPLOYMENT_TYPE_LABELS[t] }}</li>
      <li v-if="job.hours_min || job.hours_max" class="rounded-full bg-secondary px-3 py-1">{{ hoursLabel }}</li>
      <li v-if="job.start_note" class="rounded-full bg-secondary px-3 py-1">{{ job.start_note }}</li>
    </ul>
    <p v-if="salary" class="mt-3 text-lg font-bold">{{ salary }}</p>
    <p class="mt-1 text-sm text-muted-foreground">{{ location.zip }} {{ location.city }}</p>
  </NuxtLink>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, jobPath, salaryText } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hoursLabel = computed(() => props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max
  ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche`
  : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
</script>
