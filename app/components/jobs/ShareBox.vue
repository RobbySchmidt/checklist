<template>
  <section aria-labelledby="share-heading" class="space-y-4 border-t pt-10">
    <h2 id="share-heading" class="text-xl font-medium leading-tight">Kennst du jemanden, der passt?</h2>
    <p class="opacity-75">Leite die Stelle weiter. Die meisten Kolleginnen kommen über Empfehlungen.</p>
    <div class="flex flex-wrap items-center justify-between gap-6">
      <div class="flex flex-wrap gap-3">
        <a :href="links.whatsappHref" target="_blank" rel="noopener" class="h-12 inline-flex items-center rounded-full border border-border px-5 font-medium">Per WhatsApp teilen</a>
        <button type="button" class="h-12 inline-flex items-center rounded-full border border-border px-5 font-medium" @click="copy">{{ copied ? 'Link kopiert' : 'Link kopieren' }}</button>
        <NuxtLink :to="`/jobs/${job.slug}/aushang`" class="h-12 inline-flex items-center rounded-full border border-border px-5 font-medium">Aushang drucken</NuxtLink>
      </div>
      <div class="flex items-center gap-4">
        <img :src="links.qrImagePath" alt="QR-Code zu dieser Stelle" width="96" height="96" class="h-24 w-24 rounded-lg bg-white">
        <p class="text-sm opacity-75 break-all">{{ links.url }}</p>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { shareLinks } from '#shared/utils/share'
import { employerSiteUrl } from '#shared/utils/host'
const props = defineProps<{ job: Job; employer: Employer }>()
const { public: pub } = useRuntimeConfig()
const links = computed(() => shareLinks({ siteUrl: employerSiteUrl(props.employer, pub.siteUrl as string), slug: props.job.slug, title: props.job.title, employerName: props.employer.name }))
const copied = ref(false)
async function copy() {
  try { await navigator.clipboard.writeText(links.value.url); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { window.prompt('Link kopieren:', links.value.url) }
}
</script>
