<template>
  <div class="grid gap-6">
    <PortalPageHeader title="Bewerbungen" />
    <div class="grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
      <div class="grid gap-1">
        <label for="f-status" class="portal-eyebrow">Stand</label>
        <Select :model-value="statusFilter || 'all'" @update:model-value="(v) => (statusFilter = v === 'all' ? '' : String(v))">
          <SelectTrigger id="f-status" class="!h-12 w-full bg-white sm:w-52" style="border-color: var(--portal-line)"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem v-for="(label, key) in STATUS_LABELS" :key="key" :value="String(key)">{{ label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1">
        <label for="f-job" class="portal-eyebrow">Stelle</label>
        <Select :model-value="jobFilter || 'all'" @update:model-value="(v) => (jobFilter = v === 'all' ? '' : String(v))">
          <SelectTrigger id="f-job" class="!h-12 w-full bg-white sm:w-72" style="border-color: var(--portal-line)"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem v-for="j in jobs ?? []" :key="j.id" :value="j.id">{{ j.title }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div v-if="error" class="portal-card p-4 opacity-75">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <PortalEmptyState v-else-if="data && !data.length" text="Keine Bewerbungen in dieser Ansicht. Wählen Sie einen anderen Stand oder eine andere Stelle." />
    <ul v-else-if="data" class="grid gap-3">
      <li v-for="a in data" :key="a.id" class="portal-card p-4">
        <Collapsible>
          <div class="grid gap-4">
            <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2 font-medium">
                  {{ a.name }}
                  <span class="rounded-full px-2.5 py-0.5 text-sm font-medium" style="background: var(--portal-paper); color: var(--portal-text)">{{ QUALIFICATION_LABELS[a.qualification as keyof typeof QUALIFICATION_LABELS] ?? a.qualification }}</span>
                </p>
                <p v-if="a.job?.title" class="mt-1 text-sm opacity-75">{{ splitJobTitle(a.job.title).main }}<span v-if="splitJobTitle(a.job.title).suffix" class="ml-2">{{ splitJobTitle(a.job.title).suffix }}</span></p>
              </div>
              <p class="portal-eyebrow">{{ HOURS_WISH_LABELS[a.hours_wish as keyof typeof HOURS_WISH_LABELS] ?? a.hours_wish }} · Eingang {{ new Date(a.date_created).toLocaleDateString('de-DE') }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <a :href="`tel:${a.phone}`" class="portal-btn portal-btn-primary"><Phone class="size-4" aria-hidden="true" />{{ a.phone }}</a>
              <a v-if="a.email" :href="`mailto:${a.email}`" class="portal-btn"><Mail class="size-4" aria-hidden="true" />E-Mail</a>
              <CollapsibleTrigger as-child><button type="button" class="portal-btn">Details</button></CollapsibleTrigger>
            </div>
            <div class="flex flex-wrap gap-2" role="group" :aria-label="`Stand von ${a.name}`">
              <button
                v-for="(label, key) in STATUS_LABELS" :key="key" type="button" :aria-pressed="a.status === key"
                class="portal-seg min-h-11 rounded-full border px-4 text-sm font-medium"
                :style="a.status === key ? { color: `var(--portal-${key}-fg)`, background: `var(--portal-${key}-bg)`, borderColor: `var(--portal-${key}-fg)` } : {}"
                @click="a.status !== key && setStatus(a, String(key))"
              >{{ label }}</button>
            </div>
            <p v-if="a.status === 'zusage' && a.job?.status === 'published'" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              Stelle besetzt?
              <button type="button" class="min-h-11 border-b px-1 font-medium underline-offset-2 hover:underline" style="border-color: var(--portal-line)" @click="closeJob(a)">Stelle schließen</button>
            </p>
          </div>
          <CollapsibleContent class="mt-4 grid gap-4 border-t pt-4" style="border-color: var(--portal-line)">
            <div v-if="a.message"><p class="portal-eyebrow">Nachricht</p><p class="whitespace-pre-line">{{ a.message }}</p></div>
            <p v-if="a.earliest_start" class="text-sm"><span class="portal-eyebrow mr-2">Frühester Start</span>{{ a.earliest_start }}</p>
            <div class="grid gap-1">
              <label :for="`note-${a.id}`" class="portal-eyebrow">Notiz</label>
              <textarea :id="`note-${a.id}`" v-model="notes[a.id]" rows="3" maxlength="2000" class="portal-textarea" />
              <div class="flex items-center gap-3">
                <button type="button" class="portal-btn" @click="saveNote(a)">Notiz speichern</button>
                <span v-if="noteSaved === a.id" class="text-sm opacity-75">Gespeichert</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="portal-btn portal-btn-primary" @click="openMsg(a, 'invite')">Einladung</button>
              <button type="button" class="portal-btn" @click="openMsg(a, 'reject')">Absage</button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </li>
    </ul>
    <p v-if="jobClosed" class="rounded-lg p-3 text-sm" style="background: var(--portal-paper); color: var(--portal-text)" role="status">Stelle geschlossen. Sie ist nicht mehr öffentlich sichtbar.</p>
    <p v-if="actionError"class="rounded-lg p-3 text-sm" style="background: #fee2e2; color: var(--portal-danger)" role="alert">{{ actionError }}</p>
    <PortalMessageDialog v-if="me?.employer && msgApp" v-model:open="msgOpen" :kind="msgKind" :application="msgApp" :employer="me.employer" />
  </div>
</template>

<script setup lang="ts">
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS, splitJobTitle } from '#shared/utils/jobs'
import { Phone, Mail } from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
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
const jobClosed = ref(false)
async function closeJob(a: any) {
  actionError.value = ''
  jobClosed.value = false
  try {
    await $fetch(`/api/portal/jobs/${a.job.id}`, { method: 'PATCH', body: { status: 'filled' }, query: empQuery.value })
  } catch (e: any) {
    actionError.value = e?.data?.statusMessage || 'Das hat nicht geklappt. Bitte erneut versuchen.'
    return
  }
  jobClosed.value = true
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
