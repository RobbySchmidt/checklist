<template>
  <div class="jobs-paper text-foreground">
    <div class="grid w-full items-start gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <JobsJobList :jobs="jobs ?? []" :employer="employer!" :active-slug="first?.slug" class="lg:sticky lg:top-6" />
      <JobsJobDetail v-if="firstJob" :job="firstJob" :employer="employer!" heading-tag="h2" class="hidden lg:block" />
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ pageTransition: false })
useHead({ htmlAttrs: { class: 'font-jobs' } })
const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })
const { data: jobs } = await useJobs()
// Auf breiten Bildschirmen steht die erste Stelle gleich rechts, wie in der Google-Jobansicht.
const first = computed(() => jobs.value?.[0] ?? null)
// Die Liste liefert nur Kurzfelder, für die rechte Spalte braucht es die ganze Stelle.
const { data: firstJob } = await useJob(first.value?.slug ?? '')
useGenericPageSchema({ title: 'Offene Stellen' })
useSeoMeta({
  title: () => `Offene Stellen – ${employer.value?.name}`,
  description: () => `Jobs in der Pflege bei ${employer.value?.name}: ${employer.value?.service_area ?? ''}. Bewerbung in einer Minute vom Handy.`,
})
</script>
