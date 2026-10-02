<template>
  <NuxtLink :to="jobPath(job.slug)" class="grid gap-1 px-5 py-4 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
    <h2 class="text-base font-medium">{{ splitJobTitle(job.title).main }}<span v-if="splitJobTitle(job.title).suffix" class="ml-2 text-sm font-normal text-foreground opacity-75">{{ splitJobTitle(job.title).suffix }}</span></h2>
    <p class="text-sm text-foreground opacity-75">{{ location.zip }} {{ location.city }}</p>
    <JobsJobboxChips :chips="chips" class="mt-2" />
  </NuxtLink>
</template>
<script setup lang="ts">
import { Briefcase, Clock, Banknote } from 'lucide-vue-next'
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, jobPath, salaryText, splitJobTitle } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hoursLabel = computed(() => props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max
  ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche`
  : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
const chips = computed(() => [
  ...(props.job.employment_types ?? []).map((t) => ({ icon: Briefcase, label: EMPLOYMENT_TYPE_LABELS[t] })),
  ...(props.job.hours_min || props.job.hours_max ? [{ icon: Clock, label: hoursLabel.value }] : []),
  ...(props.job.start_note ? [{ icon: Clock, label: props.job.start_note }] : []),
  ...(salary.value ? [{ icon: Banknote, label: salary.value }] : []),
])
</script>
