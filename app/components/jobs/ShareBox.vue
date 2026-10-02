<template>
  <section aria-labelledby="share-heading" class="grid gap-3 border-t border-[#dadce0] p-5">
    <h2 id="share-heading" class="text-base font-medium">Weitersagen</h2>
    <p class="text-sm text-[#5f6368]">Kennst du jemanden, der passt? Leite die Stelle weiter. Die meisten Kolleginnen kommen über Empfehlungen.</p>
    <div class="flex items-center gap-4">
      <div class="flex flex-wrap gap-2">
        <a :href="links.whatsappHref" target="_blank" rel="noopener" :class="btn">Per WhatsApp teilen</a>
        <button type="button" :class="btn" @click="copy">{{ copied ? 'Link kopiert' : 'Link kopieren' }}</button>
        <NuxtLink :to="`/jobs/${job.slug}/aushang`" :class="btn">Aushang drucken</NuxtLink>
      </div>
      <img :src="links.qrImagePath" alt="QR-Code zu dieser Stelle" width="96" height="96" class="h-24 w-24 shrink-0 rounded-lg border border-[#dadce0] bg-white">
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { shareLinks } from '#shared/utils/share'
import { employerSiteUrl } from '#shared/utils/host'
const props = defineProps<{ job: Job; employer: Employer }>()
const { public: pub } = useRuntimeConfig()
const btn = 'inline-flex h-10 items-center rounded-full border border-[#dadce0] px-5 text-sm font-medium text-[#202124] hover:bg-[#f8f9fa]'
const links = computed(() => shareLinks({ siteUrl: employerSiteUrl(props.employer, pub.siteUrl as string), slug: props.job.slug, title: props.job.title, employerName: props.employer.name }))
const copied = ref(false)
async function copy() {
  try { await navigator.clipboard.writeText(links.value.url); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { window.prompt('Link kopieren:', links.value.url) }
}
</script>
