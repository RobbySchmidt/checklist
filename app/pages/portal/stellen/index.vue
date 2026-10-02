<template>
  <div class="space-y-10">
    <PortalPageHeader title="Stellen">
      <NuxtLink :to="withEmployer('/portal/stellen/neu')" class="portal-btn portal-btn-primary"><Plus class="size-4" aria-hidden="true" />Neue Stelle</NuxtLink>
    </PortalPageHeader>
    <p v-if="error" class="opacity-75">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</p>
    <PortalEmptyState v-else-if="data && !data.length" text="Noch keine Stelle angelegt.">
      <NuxtLink :to="withEmployer('/portal/stellen/neu')" class="portal-btn portal-btn-primary">Erste Stelle anlegen</NuxtLink>
    </PortalEmptyState>
    <template v-else-if="data">
      <div class="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="h-11 text-sm font-normal opacity-75">Titel</TableHead>
              <TableHead class="h-11 text-sm font-normal opacity-75">Stand</TableHead>
              <TableHead class="h-11 text-sm font-normal opacity-75">Gültig bis</TableHead>
              <TableHead class="h-11 text-sm font-normal opacity-75 text-right">Bewerbungen</TableHead>
              <TableHead class="h-11 text-sm font-normal opacity-75 text-right">Aufrufe 30 Tage</TableHead>
              <TableHead class="h-11 text-sm font-normal opacity-75"><span class="sr-only">Aktionen</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="j in data" :key="j.id">
              <TableCell class="font-medium">{{ j.title }}</TableCell>
              <TableCell><PortalStatusChip :status="j.status" /></TableCell>
              <TableCell class="tabular-nums">{{ j.valid_through ? new Date(j.valid_through).toLocaleDateString('de-DE') : '–' }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ j.applications }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ j.views30 }}</TableCell>
              <TableCell>
                <div class="flex justify-end">
                  <NuxtLink :to="withEmployer(`/portal/stellen/${j.id}`)" class="portal-icon-btn" title="Bearbeiten" aria-label="Bearbeiten"><Pencil class="size-5" aria-hidden="true" /></NuxtLink>
                  <a :href="`/jobs/${j.slug}`" target="_blank" class="portal-icon-btn" title="Vorschau" aria-label="Vorschau"><Eye class="size-5" aria-hidden="true" /></a>
                  <button type="button" class="portal-icon-btn" title="Teilen" aria-label="Teilen" @click="share(j)"><Share2 class="size-5" aria-hidden="true" /></button>
                  <button v-if="j.status === 'published'" type="button" class="portal-icon-btn" title="Schließen" aria-label="Schließen" @click="setStatus(j.id, 'filled')"><Archive class="size-5" aria-hidden="true" /></button>
                  <button v-else type="button" class="portal-icon-btn" title="Öffnen" aria-label="Öffnen" @click="setStatus(j.id, 'published')"><ArchiveRestore class="size-5" aria-hidden="true" /></button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <ul class="divide-y md:hidden">
        <li v-for="j in data" :key="j.id" class="py-5">
          <div class="flex items-start justify-between gap-3">
            <p class="min-w-0 font-medium">{{ j.title }}</p>
            <PortalStatusChip :status="j.status" class="shrink-0" />
          </div>
          <p class="mt-1 text-sm opacity-75">Gültig bis {{ j.valid_through ? new Date(j.valid_through).toLocaleDateString('de-DE') : '–' }}</p>
          <p class="mt-1 text-sm tabular-nums opacity-75">{{ j.applications }} Bewerbungen · {{ j.views30 }} Aufrufe in 30 Tagen</p>
          <div class="-mx-2 mt-4 flex">
            <NuxtLink :to="withEmployer(`/portal/stellen/${j.id}`)" class="portal-icon-btn" title="Bearbeiten" aria-label="Bearbeiten"><Pencil class="size-5" aria-hidden="true" /></NuxtLink>
            <a :href="`/jobs/${j.slug}`" target="_blank" class="portal-icon-btn" title="Vorschau" aria-label="Vorschau"><Eye class="size-5" aria-hidden="true" /></a>
            <button type="button" class="portal-icon-btn" title="Teilen" aria-label="Teilen" @click="share(j)"><Share2 class="size-5" aria-hidden="true" /></button>
            <button v-if="j.status === 'published'" type="button" class="portal-icon-btn" title="Schließen" aria-label="Schließen" @click="setStatus(j.id, 'filled')"><Archive class="size-5" aria-hidden="true" /></button>
            <button v-else type="button" class="portal-icon-btn" title="Öffnen" aria-label="Öffnen" @click="setStatus(j.id, 'published')"><ArchiveRestore class="size-5" aria-hidden="true" /></button>
          </div>
        </li>
      </ul>
    </template>
    <p v-if="actionError" class="rounded-lg p-3 text-sm" style="background: #fee2e2; color: var(--portal-danger)" role="alert">{{ actionError }}</p>
    <PortalShareDialog v-if="me?.employer && shareJob" v-model:open="shareOpen" :job="shareJob" :employer="me.employer" />
  </div>
</template>

<script setup lang="ts">
import { Plus, Pencil, Eye, Share2, Archive, ArchiveRestore } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const query = computed(() => ({ employer: route.query.employer }))
const withEmployer = (to: string) => (route.query.employer ? `${to}?employer=${route.query.employer}` : to)
const { data, error, refresh } = await useFetch<any[]>('/api/portal/jobs', { query })
const { data: me } = await useFetch<any>('/api/portal/me', { query })

const shareJob = ref<{ title: string; slug: string } | null>(null)
const shareOpen = ref(false)
function share(j: { title: string; slug: string }) { shareJob.value = j; shareOpen.value = true }

const actionError = ref('')
async function setStatus(id: string, status: 'filled' | 'published') {
  actionError.value = ''
  try {
    await $fetch(`/api/portal/jobs/${id}`, { method: 'PATCH', body: { status }, query: query.value })
    await refresh()
  } catch (e: any) {
    actionError.value = e?.data?.statusMessage || 'Das hat nicht geklappt. Bitte erneut versuchen.'
  }
}
</script>
