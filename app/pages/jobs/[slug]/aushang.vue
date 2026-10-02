<!-- app/pages/jobs/[slug]/aushang.vue -->
<template>
  <div v-if="job && employer" class="mx-auto max-w-[210mm] px-10 py-16 grid gap-8 text-center print:py-8">
    <p class="text-base font-medium">{{ employer.name }}</p>
    <h1 class="text-3xl md:text-4xl leading-tight font-medium tracking-tight text-balance">{{ job.title }}</h1>
    <p v-if="salary" class="text-3xl md:text-4xl leading-tight font-medium">{{ salary }}</p>
    <p class="text-xl">Kennst du jemanden? Oder willst du selbst? Handy raus, Code scannen, in einer Minute bewerben.</p>
    <img :src="links.qrImagePath" alt="QR-Code zur Stellenseite" width="320" height="320" class="mx-auto h-80 w-80">
    <p class="text-base break-all">{{ links.url }}</p>
    <p class="opacity-75">{{ employer.service_area }}</p>
    <button type="button" class="print:hidden h-12 rounded-full bg-primary px-6 font-medium text-primary-foreground" @click="print()">Drucken</button>
  </div>
</template>
<script setup lang="ts">
import { salaryText } from '#shared/utils/jobs'
import { shareLinks } from '#shared/utils/share'
import { employerSiteUrl } from '#shared/utils/host'
definePageMeta({ layout: 'bare' })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const { employer } = await useEmployer()
const { data: job } = await useJob(route.params.slug as string)
if (!employer.value || !job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })
const salary = computed(() => salaryText(job.value!))
const links = computed(() => shareLinks({ siteUrl: employerSiteUrl(employer.value, pub.siteUrl as string), slug: job.value!.slug, title: job.value!.title, employerName: employer.value!.name }))
const print = () => window.print()
useSeoMeta({ title: () => `Aushang: ${job.value?.title}`, robots: 'noindex, nofollow' })
</script>
