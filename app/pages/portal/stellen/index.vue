<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Stellen</h1>
      <NuxtLink :to="withEmployer('/portal/stellen/neu')" class="inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">Neue Stelle</NuxtLink>
    </div>
    <div v-if="error" class="rounded-xl border border-border p-4 text-muted-foreground">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <p v-else-if="data && !data.length" class="text-muted-foreground">Noch keine Stellen. Legen Sie die erste an.</p>
    <Table v-else-if="data">
      <TableHeader>
        <TableRow>
          <TableHead>Titel</TableHead>
          <TableHead>Stand</TableHead>
          <TableHead>Gültig bis</TableHead>
          <TableHead class="text-right">Bewerbungen</TableHead>
          <TableHead class="text-right">Aufrufe 30 Tage</TableHead>
          <TableHead>Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="j in data" :key="j.id">
          <TableCell class="font-semibold">{{ j.title }}</TableCell>
          <TableCell><Badge :variant="j.status === 'published' ? 'default' : 'secondary'">{{ STATUS_LABELS[j.status] ?? j.status }}</Badge></TableCell>
          <TableCell>{{ j.valid_through ? new Date(j.valid_through).toLocaleDateString('de-DE') : '–' }}</TableCell>
          <TableCell class="text-right tabular-nums">{{ j.applications }}</TableCell>
          <TableCell class="text-right tabular-nums">{{ j.views30 }}</TableCell>
          <TableCell>
            <div class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <NuxtLink :to="withEmployer(`/portal/stellen/${j.id}`)" class="underline">Bearbeiten</NuxtLink>
              <a :href="`/jobs/${j.slug}`" target="_blank" class="underline">Vorschau</a>
              <button type="button" class="underline" @click="share(j)">Teilen</button>
              <button v-if="j.status === 'published'" type="button" class="underline" @click="setStatus(j.id, 'filled')">Schließen</button>
              <button v-else type="button" class="underline" @click="setStatus(j.id, 'published')">Öffnen</button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <p v-if="actionError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{{ actionError }}</p>
    <PortalShareDialog v-if="me?.employer && shareJob" v-model:open="shareOpen" :job="shareJob" :employer="me.employer" />
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const STATUS_LABELS: Record<string, string> = { draft: 'Entwurf', published: 'Veröffentlicht', filled: 'Besetzt', expired: 'Abgelaufen' }
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
