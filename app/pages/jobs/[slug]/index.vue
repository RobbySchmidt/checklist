<template>
  <div v-if="job && employer" class="jobs-paper text-foreground">
    <div class="mx-auto grid w-full max-w-6xl items-start gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <JobsJobList :jobs="jobs ?? []" :employer="employer" :active-slug="job.slug" heading-tag="h2" class="hidden lg:sticky lg:top-6 lg:block" />
      <JobsJobDetail :job="job" :employer="employer" :heading-id="headingId" show-mobile-apply />
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { employerSiteUrl } from '#shared/utils/host'

useHead({ htmlAttrs: { class: 'font-jobs' } })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const headingId = 'job-heading'
const slug = route.params.slug as string

const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })

const { data: job } = await useJob(slug)
const { data: jobs } = await useJobs()
if (!job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })

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
