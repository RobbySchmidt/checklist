<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Stelle teilen</DialogTitle>
        <DialogDescription>{{ job.title }}</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4">
        <div class="grid gap-1">
          <label for="share-url" class="text-sm font-medium">Link</label>
          <div class="flex gap-2">
            <input id="share-url" :value="links.url" readonly class="h-12 min-w-0 flex-1 rounded-lg border border-border px-4 text-base">
            <button type="button" class="h-12 rounded-full border border-border px-5 font-medium" @click="copy">{{ copied ? 'Kopiert' : 'Kopieren' }}</button>
          </div>
        </div>
        <a :href="links.whatsappHref" target="_blank" rel="noopener" class="inline-flex h-12 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">Per WhatsApp teilen</a>
        <div class="grid justify-items-center gap-2">
          <img :src="links.qrImagePath" alt="QR-Code zur Stelle" width="160" height="160" class="h-40 w-40">
          <a :href="`/jobs/${job.slug}/aushang`" target="_blank" class="text-sm underline">Aushang mit QR-Code öffnen</a>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Employer } from '#shared/utils/jobs'
import { shareLinks } from '#shared/utils/share'
import { employerSiteUrl } from '#shared/utils/host'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{ job: { title: string; slug: string }; employer: Employer & { domains?: string[] | null } }>()
const open = defineModel<boolean>('open', { default: false })
const pub = useRuntimeConfig().public
const copied = ref(false)

const siteUrl = computed(() => employerSiteUrl(props.employer, pub.siteUrl as string))
const links = computed(() => shareLinks({ siteUrl: siteUrl.value, slug: props.job.slug, title: props.job.title, employerName: props.employer.name }))

async function copy() {
  try { await navigator.clipboard.writeText(links.value.url); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { /* Zwischenablage nicht verfügbar */ }
}
</script>
