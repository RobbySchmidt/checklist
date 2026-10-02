<template>
  <div v-if="job && employer" class="bg-[#f8f9fa] text-[#202124]">
    <div class="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <article :aria-labelledby="headingId" class="overflow-hidden rounded-lg border border-[#dadce0] bg-white">
        <JobsJobHeader :job="job" :employer="employer" :heading-id="headingId" />

        <a href="#bewerben" class="fixed inset-x-4 bottom-4 z-40 rounded-full bg-primary py-4 text-center text-base font-medium text-primary-foreground shadow-lg md:hidden">Jetzt bewerben</a>

        <section class="grid gap-3 border-t border-[#dadce0] p-5 text-sm prose-job">
          <h2 class="text-base font-medium">Stellenbeschreibung</h2>
          <p v-if="job.intro">{{ job.intro }}</p>
          <div v-if="job.tasks"><h3 class="mb-1 text-sm font-medium">Aufgaben</h3><div v-html="sanitizeHtml(job.tasks)" /></div>
          <div v-if="job.requirements"><h3 class="mb-1 text-sm font-medium">Voraussetzungen</h3><div v-html="sanitizeHtml(job.requirements)" /></div>
          <p v-if="employer.about" class="text-[#5f6368]">{{ employer.about }}</p>
        </section>

        <JobsJobBenefits :job="job" :employer="employer" />

        <section id="bewerben" aria-labelledby="apply-heading" class="grid scroll-mt-24 gap-3 border-t border-[#dadce0] p-5">
          <h2 id="apply-heading" class="text-base font-medium">In einer Minute bewerben</h2>
          <p class="text-sm text-[#5f6368]">Kein Lebenslauf, kein Anschreiben. {{ employer.name }} ruft dich innerhalb von 24 Stunden zurück.</p>
          <JobsApplyForm :job="job" :employer="employer" />
        </section>

        <JobsShareBox :job="job" :employer="employer" />

        <p class="border-t border-[#dadce0] p-5 text-sm text-[#5f6368]">Veröffentlicht: {{ published }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { employerSiteUrl } from '#shared/utils/host'

useHead({ htmlAttrs: { class: 'font-roboto' } })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const headingId = 'job-heading'
const slug = route.params.slug as string

const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })

const { data: job } = await useJob(slug)
if (!job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })

const published = computed(() => job.value ? new Date(job.value.date_posted).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '')
const baseUrl = computed(() => employerSiteUrl(employer.value, pub.siteUrl as string))
const logoUrl = computed(() => {
  const logo = employer.value?.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}` : null
})
const posting = computed(() => job.value && employer.value
  ? buildJobPosting({ job: job.value, employer: employer.value, siteUrl: baseUrl.value, logoUrl: logoUrl.value })
  : null)

// Für den Prüfbericht in der DevToolbar
const current = useState<Record<string, any> | null>('jobposting:current', () => null)
watchEffect(() => { current.value = posting.value })
onUnmounted(() => { current.value = null })

// Seitenaufruf zählen (nur im Browser, ohne Cookies)
onMounted(() => {
  if (!job.value) return
  const src = String(route.query.src ?? '')
  $fetch('/api/track', { method: 'POST', body: { job: job.value.id, source: src || (document.referrer.includes('google.') ? 'google' : 'direct') } }).catch(() => {})
})

const registry = useSchemaRegistry()
watchEffect(() => { if (posting.value) registry.add(posting.value) })
useGenericPageSchema(computed(() => ({ title: job.value?.title })))

const description = computed(() => job.value?.intro || `${job.value?.title} bei ${employer.value?.name} in ${employer.value?.address_city}. Bewerbung in einer Minute vom Handy.`)
useSeoMeta({
  title: () => `${job.value?.title} – ${employer.value?.name}`,
  description: () => description.value,
  ogTitle: () => `${job.value?.title} – ${employer.value?.name}`,
  ogDescription: () => description.value,
  ogUrl: () => baseUrl.value + route.path,
  robots: 'index, follow',
})
</script>
