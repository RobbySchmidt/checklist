<!-- app/pages/jobs/[slug]/google-vorschau.vue -->
<template>
  <div v-if="job && employer" class="min-h-screen bg-[#f8f9fa] text-[#202124]" style="font-family: Roboto, Arial, sans-serif">
    <p class="bg-[#fef3c7] px-4 py-2 text-center text-sm text-[#92400e]" role="note">Nachbau der Google-Jobansicht, fürs Erste. Keine echte Google-Seite.</p>

    <div class="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <div class="flex h-12 items-center gap-3 rounded-full border border-[#dadce0] bg-white px-5 text-base">
        <Search class="size-5 shrink-0 text-[#5f6368]" aria-hidden="true" />{{ query }}
      </div>

      <section aria-labelledby="box-heading" class="overflow-hidden rounded-lg border border-[#dadce0] bg-white">
        <h1 id="box-heading" class="border-b border-[#dadce0] px-5 py-4 text-xl font-medium">Stellenangebote</h1>
        <div class="lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div class="divide-y divide-[#dadce0] lg:border-r lg:border-[#dadce0]">
            <div v-for="(e, i) in entries" :key="e.title">
              <JobsJobboxCard v-bind="e.card" :active="selected === i" @select="selected = i" />
              <div v-if="i === 0" class="border-t border-[#dadce0] lg:hidden"><JobsJobboxDetail v-bind="e.detail" /></div>
            </div>
          </div>
          <div class="hidden lg:block"><JobsJobboxDetail v-bind="entries[selected]!.detail" /></div>
        </div>
      </section>

      <p class="border-l border-[#dadce0] pl-4 text-sm text-[#5f6368]">Was sich nicht simulieren lässt: ob Google die Stelle tatsächlich aufnimmt und wie schnell. Das entscheidet Google nach eigenen Regeln. Die Vorschau zeigt, wie es aussieht, wenn es klappt, und der Prüfbericht zeigt, dass die technischen Voraussetzungen erfüllt sind. Im Kundengespräch sollte das so gesagt werden, nicht als Garantie.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Search, Briefcase, Clock, Banknote } from 'lucide-vue-next'
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText } from '#shared/utils/jobs'
definePageMeta({ layout: 'bare' })
useHead({ link: [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap' },
] })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const { employer } = await useEmployer()
const { data: job } = await useJob(route.params.slug as string)
if (!employer.value || !job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })

const selected = ref(0)
const logoSrc = computed(() => {
  const logo = employer.value?.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}?width=40&height=40&fit=contain&format=auto` : undefined
})
const posting = computed(() => buildJobPosting({ job: job.value!, employer: employer.value!, siteUrl: pub.siteUrl as string, logoUrl: logoSrc.value }))
const loc = computed(() => jobLocation(job.value!, employer.value!))
const query = computed(() => `${job.value!.title.replace(/\s*\(m\/w\/d\)/i, '')} ${loc.value.city}`)
const daysAgo = computed(() => Math.max(0, Math.round((Date.now() - new Date(job.value!.date_posted).getTime()) / 86400000)))
const ago = (d: number) => (d === 0 ? 'heute' : `vor ${d} Tag${d === 1 ? '' : 'en'}`)
const published = computed(() => new Date(job.value!.date_posted).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }))
const ourChips = computed(() => [
  ...(job.value!.employment_types ?? []).map((t) => ({ icon: Briefcase, label: EMPLOYMENT_TYPE_LABELS[t] })),
  { icon: Clock, label: ago(daysAgo.value) },
  ...(salaryText(job.value!) ? [{ icon: Banknote, label: salaryText(job.value!)! }] : []),
])
const fake = (title: string, org: string, place: string, chips: any[]) => ({
  title,
  card: { title, org, place, chips, via: 'Jobportal (fiktiv)' },
  detail: { title, org, place, chips },
})
const entries = computed(() => {
  const city = loc.value.city
  const org = posting.value.hiringOrganization.name
  const ours = {
    title: posting.value.title,
    card: { title: posting.value.title, org, place: city, chips: ourChips.value, logoSrc: logoSrc.value },
    detail: { title: posting.value.title, org, orgName: employer.value!.name, place: city, chips: ourChips.value, to: `/jobs/${job.value!.slug}`, job: job.value, published: published.value },
  }
  return [
    ours,
    fake('Pflegefachkraft (m/w/d) für Zeitarbeit', 'Beispiel Personalservice', city, [{ icon: Briefcase, label: 'Vollzeit' }, { icon: Clock, label: ago(5) }]),
    fake('Altenpfleger / Pflegefachkraft (m/w/d)', 'Beispiel Jobbörse', `${city} und Umgebung`, [{ icon: Briefcase, label: 'Vollzeit' }, { icon: Clock, label: ago(12) }]),
  ]
})
useSeoMeta({ title: 'Vorschau Jobbox', robots: 'noindex, nofollow' })
</script>
