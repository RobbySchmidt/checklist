<!-- app/pages/jobs/[slug]/google-vorschau.vue -->
<template>
  <div v-if="job && employer" class="min-h-screen bg-background">
    <p class="bg-destructive text-white text-center text-base px-4 py-3" role="note">Demo: Dies ist eine Nachbildung, keine echte Google-Seite.</p>

    <div class="mx-auto max-w-3xl px-4 py-8 space-y-10">
      <div class="space-y-4">
      <div class="h-12 rounded-lg border border-border bg-white px-5 flex items-center text-base">{{ query }}</div>

      <section aria-labelledby="box-heading" class="rounded-lg border border-border bg-white">
        <h1 id="box-heading" class="px-5 py-4 text-xl font-medium leading-tight">Stellenangebote</h1>
        <div class="divide-y border-y">
        <JobsJobboxCard :title="posting.title" :org="posting.hiringOrganization.name" :place="place" :chips="chips" :to="`/jobs/${job.slug}`" :logo-src="logoSrc" />
        <JobsJobboxCard title="Pflegefachkraft (m/w/d) für Zeitarbeit" org="Beispiel Personalservice" :place="employer.address_city" :chips="['Vollzeit', 'vor 5 Tagen']" via="Jobportal (fiktiv)" />
        <JobsJobboxCard title="Altenpfleger / Pflegefachkraft (m/w/d)" org="Beispiel Jobbörse" :place="`${employer.address_city} und Umgebung`" :chips="['Vollzeit', 'vor 12 Tagen']" via="Jobbörse (fiktiv)" />
        </div>
        <p class="px-5 py-4 text-sm opacity-75">Weitere Stellenangebote</p>
      </section>
      </div>

      <section class="border-l-2 pl-4 space-y-2">
        <h2 class="font-medium">Was sich nicht simulieren lässt</h2>
        <p>Ob Google die Stelle tatsächlich aufnimmt und wie schnell. Das entscheidet Google nach eigenen Regeln. Die Vorschau zeigt, wie es aussieht, wenn es klappt, und der Prüfbericht zeigt, dass die technischen Voraussetzungen erfüllt sind. Im Kundengespräch sollte das so gesagt werden, nicht als Garantie.</p>
      </section>

      <section class="grid gap-2 text-sm opacity-75">
        <p>Grundlage dieser Vorschau sind dieselben Daten, die als JobPosting-Markup auf der Stellenseite liegen. Prüfbericht: Dev-Toolbar auf der Stellenseite oder <a class="underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">Rich-Results-Test</a> mit der öffentlichen URL.</p>
        <NuxtLink :to="`/jobs/${job.slug}`" class="underline">Zur Stellenseite</NuxtLink>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText } from '#shared/utils/jobs'
definePageMeta({ layout: 'bare' })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const { employer } = await useEmployer()
const { data: job } = await useJob(route.params.slug as string)
if (!employer.value || !job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })

const logoSrc = computed(() => {
  const logo = employer.value?.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}?width=40&height=40&fit=contain&format=auto` : undefined
})
const posting = computed(() => buildJobPosting({ job: job.value!, employer: employer.value!, siteUrl: pub.siteUrl as string, logoUrl: logoSrc.value }))
const loc = computed(() => jobLocation(job.value!, employer.value!))
const place = computed(() => `${loc.value.city}`)
const query = computed(() => `${job.value!.title.replace(/\s*\(m\/w\/d\)/i, '')} ${loc.value.city}`)
const daysAgo = computed(() => Math.max(0, Math.round((Date.now() - new Date(job.value!.date_posted).getTime()) / 86400000)))
const chips = computed(() => [
  ...(job.value!.employment_types ?? []).map((t) => EMPLOYMENT_TYPE_LABELS[t]),
  ...(salaryText(job.value!) ? [salaryText(job.value!)!] : []),
  daysAgo.value === 0 ? 'heute' : `vor ${daysAgo.value} Tag${daysAgo.value === 1 ? '' : 'en'}`,
])
useSeoMeta({ title: 'Vorschau Jobbox', robots: 'noindex, nofollow' })
</script>
