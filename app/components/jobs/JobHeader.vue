<template>
  <header class="grid gap-4 p-5">
    <div class="flex items-start justify-between gap-4">
    <div class="grid min-w-0 flex-1 gap-1">
      <p class="text-sm text-[#5f6368]">{{ employer.name }} · {{ location.city }}<span v-if="employer.service_area"> · Einsatz: {{ employer.service_area }}</span></p>
      <h1 :id="headingId" class="text-[22px] leading-snug font-normal">{{ splitJobTitle(job.title).main }}<span v-if="splitJobTitle(job.title).suffix" class="ml-2 text-sm text-[#5f6368]">{{ splitJobTitle(job.title).suffix }}</span></h1>
      <p class="text-sm text-[#5f6368]">{{ location.street }}, {{ location.zip }} {{ location.city }}</p>
    </div>
    <img v-if="logoSrc" :src="logoSrc" alt="" width="56" height="56" class="h-14 w-14 shrink-0 rounded-lg border border-[#dadce0] bg-white object-contain">
    </div>
    <JobsJobboxChips :chips="chips" />
    <div v-if="salary" class="rounded-lg bg-primary px-5 py-4 text-primary-foreground">
      <p class="text-[22px] leading-snug font-medium">{{ salary }}</p>
      <p v-if="job.salary_note" class="text-sm">{{ job.salary_note }}</p>
    </div>
    <a href="#bewerben" class="inline-flex h-12 w-fit items-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Jetzt bewerben</a>
  </header>
</template>
<script setup lang="ts">
import { Briefcase, Clock } from 'lucide-vue-next'
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText, splitJobTitle } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer; headingId: string }>()
const pub = useRuntimeConfig().public
const logoId = computed(() => { const l = props.employer.logo; return typeof l === 'string' ? l : l?.id })
const logoSrc = computed(() => logoId.value ? `${pub.directusUrl}/assets/${logoId.value}?width=112&height=112&fit=contain&format=auto` : '')
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hours = computed(() => props.job.hours_min || props.job.hours_max
  ? (props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche` : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
  : '')
const chips = computed(() => [
  ...(props.job.employment_types ?? []).map((t) => ({ icon: Briefcase, label: EMPLOYMENT_TYPE_LABELS[t] })),
  ...(hours.value ? [{ icon: Clock, label: hours.value }] : []),
  ...(props.job.start_note ? [{ icon: Clock, label: props.job.start_note }] : []),
])
</script>
