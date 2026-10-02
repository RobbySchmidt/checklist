<template>
  <div class="grid gap-6">
    <h1 class="text-2xl font-bold">Bewerbungen</h1>
    <div class="flex flex-wrap gap-4">
      <div class="grid gap-1">
        <label for="f-status" class="text-sm font-semibold">Stand</label>
        <select id="f-status" v-model="statusFilter" class="h-11 rounded-lg border border-border bg-background px-3">
          <option value="">Alle</option>
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="grid gap-1">
        <label for="f-job" class="text-sm font-semibold">Stelle</label>
        <select id="f-job" v-model="jobFilter" class="h-11 rounded-lg border border-border bg-background px-3">
          <option value="">Alle</option>
          <option v-for="j in jobs ?? []" :key="j.id" :value="j.id">{{ j.title }}</option>
        </select>
      </div>
    </div>
    <div v-if="error" class="rounded-xl border border-border p-4 text-muted-foreground">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <p v-else-if="data && !data.length" class="text-muted-foreground">Keine Bewerbungen in dieser Ansicht.</p>
    <ul v-else-if="data" class="grid gap-3">
      <li v-for="a in data" :key="a.id" class="rounded-xl border border-border p-4">
        <Collapsible>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold">{{ a.name }} <span class="font-normal text-muted-foreground">· {{ a.job?.title }}</span></p>
              <p class="text-sm text-muted-foreground">
                {{ QUALIFICATION_LABELS[a.qualification as keyof typeof QUALIFICATION_LABELS] ?? a.qualification }} · {{ HOURS_WISH_LABELS[a.hours_wish as keyof typeof HOURS_WISH_LABELS] ?? a.hours_wish }} · {{ new Date(a.date_created).toLocaleDateString('de-DE') }}
              </p>
              <p class="text-sm"><a :href="`tel:${a.phone}`" class="underline">{{ a.phone }}</a><template v-if="a.email"> · <a :href="`mailto:${a.email}`" class="underline">{{ a.email }}</a></template></p>
            </div>
            <div class="flex items-center gap-2">
              <label :for="`st-${a.id}`" class="sr-only">Stand</label>
              <select :id="`st-${a.id}`" :value="a.status" class="h-11 rounded-lg border border-border bg-background px-3" @change="setStatus(a, ($event.target as HTMLSelectElement).value)">
                <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
              <CollapsibleTrigger as-child><button type="button" class="h-11 rounded-full border border-border px-4 text-sm font-semibold">Details</button></CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent class="mt-4 grid gap-4 border-t border-border pt-4">
            <div v-if="a.message"><p class="text-sm font-semibold">Nachricht</p><p class="whitespace-pre-line">{{ a.message }}</p></div>
            <p v-if="a.earliest_start" class="text-sm"><span class="font-semibold">Frühester Start:</span> {{ a.earliest_start }}</p>
            <div class="grid gap-1">
              <label :for="`note-${a.id}`" class="text-sm font-semibold">Notiz</label>
              <textarea :id="`note-${a.id}`" v-model="notes[a.id]" rows="3" maxlength="2000" class="rounded-lg border border-border px-4 py-3 text-base" />
              <div class="flex items-center gap-3">
                <button type="button" class="h-11 rounded-full border border-border px-5 font-semibold" @click="saveNote(a)">Notiz speichern</button>
                <span v-if="noteSaved === a.id" class="text-sm text-muted-foreground">Gespeichert</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground" @click="openMsg(a, 'invite')">Einladung</button>
              <button type="button" class="h-11 rounded-full border border-border px-5 font-semibold" @click="openMsg(a, 'reject')">Absage</button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </li>
    </ul>
    <p v-if="actionError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{{ actionError }}</p>
    <PortalMessageDialog v-if="me?.employer && msgApp" v-model:open="msgOpen" :kind="msgKind" :application="msgApp" :employer="me.employer" />
  </div>
</template>

<script setup lang="ts">
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from '#shared/utils/jobs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const STATUS_LABELS: Record<string, string> = { neu: 'Neu', kontaktiert: 'Kontaktiert', gespraech: 'Gespräch', zusage: 'Zusage', absage: 'Absage' }
const route = useRoute()
const statusFilter = ref('neu')
const jobFilter = ref('')
const query = computed(() => ({ employer: route.query.employer, status: statusFilter.value || undefined, job: jobFilter.value || undefined }))
const empQuery = computed(() => ({ employer: route.query.employer }))
const { data, error, refresh } = await useFetch<any[]>('/api/portal/applications', { query })
const { data: jobs } = await useFetch<any[]>('/api/portal/jobs', { query: empQuery })
const { data: me } = await useFetch<any>('/api/portal/me', { query: empQuery })

const notes = reactive<Record<string, string>>({})
watch(data, (rows) => { for (const r of rows ?? []) if (!(r.id in notes)) notes[r.id] = r.note ?? '' }, { immediate: true })

const actionError = ref('')
const noteSaved = ref('')
async function patch(id: string, body: Record<string, string>) {
  actionError.value = ''
  try { await $fetch(`/api/portal/applications/${id}`, { method: 'PATCH', body, query: empQuery.value }); return true } catch (e: any) {
    actionError.value = e?.data?.statusMessage || 'Das hat nicht geklappt. Bitte erneut versuchen.'
    return false
  }
}
async function setStatus(a: any, status: string) {
  await patch(a.id, { status })
  await refresh()
}
async function saveNote(a: any) {
  if (await patch(a.id, { note: notes[a.id] ?? '' })) { noteSaved.value = a.id; setTimeout(() => (noteSaved.value = ''), 2000) }
}

const msgApp = ref<any>(null)
const msgKind = ref<'invite' | 'reject'>('invite')
const msgOpen = ref(false)
function openMsg(a: any, kind: 'invite' | 'reject') { msgApp.value = a; msgKind.value = kind; msgOpen.value = true }
</script>
