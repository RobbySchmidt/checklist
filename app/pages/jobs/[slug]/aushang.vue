<!-- app/pages/jobs/[slug]/aushang.vue -->
<template>
  <div v-if="job && employer" class="mx-auto max-w-[210mm] px-10 py-16 grid gap-8 text-center print:py-8">
    <div class="space-y-4">
      <p class="text-sm opacity-75">{{ employer.name }}</p>
      <h1 class="text-3xl font-medium leading-tight text-balance md:text-4xl">{{ job.title }}</h1>
    </div>
    <p>Kennst du jemanden? Oder willst du selbst? Handy raus, Code scannen, in einer Minute bewerben.</p>
    <img :src="links.qrImagePath" alt="QR-Code zur Stellenseite" width="320" height="320" class="mx-auto h-80 w-80">
    <p class="text-sm opacity-75 break-all">{{ links.url }}</p>
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
