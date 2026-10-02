<!-- app/components/jobs/JobDetail.vue: komplette Stelle (Kopf, Beschreibung, Benefits, Bewerbung, Teilen); rechte Spalte der Stellenseiten -->
<template>
  <article :aria-labelledby="headingId" class="lp-card overflow-hidden">
    <JobsJobHeader :job="job" :employer="employer" :heading-id="headingId" :heading-tag="headingTag" />

    <a v-if="showMobileApply" href="#bewerben" class="lp-btn fixed inset-x-4 bottom-4 z-40 shadow-lg md:!hidden">Jetzt bewerben <ArrowRight class="arrow" :size="19" aria-hidden="true" /></a>

    <section class="grid gap-3 border-t border-border p-5 text-sm prose-job">
      <h2 class="text-base font-medium">Stellenbeschreibung</h2>
      <p v-if="job.intro">{{ job.intro }}</p>
      <div v-if="job.tasks"><h3 class="mb-1 text-sm font-medium">Aufgaben</h3><div v-html="sanitizeHtml(job.tasks)" /></div>
      <div v-if="job.requirements"><h3 class="mb-1 text-sm font-medium">Voraussetzungen</h3><div v-html="sanitizeHtml(job.requirements)" /></div>
      <p v-if="employer.about" class="text-foreground opacity-75">{{ employer.about }}</p>
    </section>

    <JobsJobBenefits :job="job" :employer="employer" />

    <section id="bewerben" aria-labelledby="apply-heading" class="grid scroll-mt-24 gap-3 border-t border-border p-5">
      <h2 id="apply-heading" class="text-base font-medium">In einer Minute bewerben</h2>
      <p class="text-sm text-foreground opacity-75">Kein Lebenslauf, kein Anschreiben. {{ employer.name }} ruft dich innerhalb von 24 Stunden zurück.</p>
      <JobsApplyForm :job="job" :employer="employer" />
    </section>

    <JobsShareBox :job="job" :employer="employer" />

    <p class="border-t border-border p-5 text-sm text-foreground opacity-75">Veröffentlicht: {{ published }}</p>
  </article>
</template>
<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { Job, Employer } from '#shared/utils/jobs'
const props = withDefaults(defineProps<{ job: Job; employer: Employer; headingId?: string; headingTag?: 'h1' | 'h2'; showMobileApply?: boolean }>(), { headingId: 'job-heading', headingTag: 'h1', showMobileApply: false })
const published = computed(() => new Date(props.job.date_posted).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }))
</script>
