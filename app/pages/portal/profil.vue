<template>
  <div class="grid gap-6">
    <h1 class="text-2xl font-bold">Profil</h1>
    <div v-if="error" class="rounded-xl border border-border p-4 text-muted-foreground">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <form v-else-if="form" class="grid max-w-3xl gap-8" novalidate @submit.prevent="save">
      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Dienst</legend>
        <div class="grid gap-1">
          <label for="p-name" class="font-semibold">Name</label>
          <input id="p-name" v-model="form.name" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
        </div>
        <div class="grid gap-1">
          <label for="p-legal" class="font-semibold">Rechtlicher Name <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="p-legal" v-model="form.legal_name" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.legal_name" class="text-sm text-destructive">{{ errors.legal_name }}</p>
        </div>
        <div class="grid gap-2">
          <span class="font-semibold">Logo</span>
          <img v-if="logoId" :src="`${directusUrl}/assets/${logoId}?width=160`" alt="Aktuelles Logo" class="max-h-24 w-auto max-w-40 rounded border border-border bg-white p-2">
          <p v-else class="text-sm text-muted-foreground">Noch kein Logo.</p>
          <label for="p-logo" class="text-sm text-muted-foreground">PNG, JPG, SVG oder WebP, höchstens 2 MB. Wird sofort gespeichert.</label>
          <input id="p-logo" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" @change="upload">
          <p v-if="uploadError" class="text-sm text-destructive" role="alert">{{ uploadError }}</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="p-c1" class="font-semibold">Hauptfarbe <span class="font-normal text-muted-foreground">(#rrggbb)</span></label>
            <input id="p-c1" v-model="form.color_primary" type="text" placeholder="#1d6b57" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.color_primary" class="text-sm text-destructive">{{ errors.color_primary }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-c2" class="font-semibold">Zweitfarbe <span class="font-normal text-muted-foreground">(#rrggbb)</span></label>
            <input id="p-c2" v-model="form.color_secondary" type="text" placeholder="#f4efe6" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.color_secondary" class="text-sm text-destructive">{{ errors.color_secondary }}</p>
          </div>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Kontakt</legend>
        <div class="grid gap-1">
          <label for="p-street" class="font-semibold">Straße und Hausnummer</label>
          <input id="p-street" v-model="form.address_street" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.address_street" class="text-sm text-destructive">{{ errors.address_street }}</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="p-zip" class="font-semibold">PLZ</label>
            <input id="p-zip" v-model="form.address_zip" type="text" inputmode="numeric" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.address_zip" class="text-sm text-destructive">{{ errors.address_zip }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-city" class="font-semibold">Ort</label>
            <input id="p-city" v-model="form.address_city" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.address_city" class="text-sm text-destructive">{{ errors.address_city }}</p>
          </div>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="p-phone" class="font-semibold">Telefon <span class="font-normal text-muted-foreground">(optional)</span></label>
            <input id="p-phone" v-model="form.phone" type="tel" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.phone" class="text-sm text-destructive">{{ errors.phone }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-web" class="font-semibold">Website <span class="font-normal text-muted-foreground">(optional)</span></label>
            <input id="p-web" v-model="form.website" type="url" placeholder="https://" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.website" class="text-sm text-destructive">{{ errors.website }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-mail" class="font-semibold">E-Mail für Bewerbungen</label>
            <input id="p-mail" v-model="form.apply_email" type="email" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.apply_email" class="text-sm text-destructive">{{ errors.apply_email }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-wa" class="font-semibold">WhatsApp-Nummer <span class="font-normal text-muted-foreground">(optional)</span></label>
            <input id="p-wa" v-model="form.apply_whatsapp" type="text" inputmode="numeric" placeholder="491511234567" class="h-12 rounded-lg border border-border px-4 text-base">
            <p class="text-sm text-muted-foreground">Nur Ziffern, international ohne Plus.</p>
            <p v-if="errors.apply_whatsapp" class="text-sm text-destructive">{{ errors.apply_whatsapp }}</p>
          </div>
        </div>
        <div class="grid gap-1">
          <label for="p-area" class="font-semibold">Einsatzgebiet <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="p-area" v-model="form.service_area" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.service_area" class="text-sm text-destructive">{{ errors.service_area }}</p>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Arbeiten bei uns</legend>
        <div class="grid gap-1">
          <label for="p-about" class="font-semibold">Über uns</label>
          <textarea id="p-about" v-model="form.about" rows="4" class="rounded-lg border border-border px-4 py-3 text-base" />
          <p v-if="errors.about" class="text-sm text-destructive">{{ errors.about }}</p>
        </div>
        <div class="grid gap-1">
          <label for="p-sched" class="font-semibold">Dienstplan</label>
          <textarea id="p-sched" v-model="form.schedule_model" rows="3" class="rounded-lg border border-border px-4 py-3 text-base" />
          <p v-if="errors.schedule_model" class="text-sm text-destructive">{{ errors.schedule_model }}</p>
        </div>
        <div class="grid gap-3">
          <span class="font-semibold">Benefits</span>
          <div v-for="(b, i) in form.benefits" :key="i" class="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div class="grid gap-1">
              <label :for="`b-l-${i}`" class="text-sm font-semibold">Titel</label>
              <input :id="`b-l-${i}`" v-model="b.label" type="text" class="h-11 rounded-lg border border-border px-3">
            </div>
            <div class="grid gap-1">
              <label :for="`b-d-${i}`" class="text-sm font-semibold">Detail <span class="font-normal text-muted-foreground">(optional)</span></label>
              <input :id="`b-d-${i}`" v-model="b.detail" type="text" class="h-11 rounded-lg border border-border px-3">
            </div>
            <button type="button" class="h-11 rounded-full border border-border px-4 text-sm font-semibold" @click="form.benefits.splice(i, 1)">Entfernen</button>
          </div>
          <div><button v-if="form.benefits.length < 12" type="button" class="h-11 rounded-full border border-border px-5 font-semibold" @click="form.benefits.push({ label: '', detail: '' })">Benefit hinzufügen</button></div>
          <p v-if="errors.benefits" class="text-sm text-destructive">{{ errors.benefits }}</p>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Benachrichtigungen</legend>
        <label class="flex items-center gap-3"><input v-model="form.notify_reminders" type="checkbox" class="h-5 w-5"><span>Erinnerung, wenn eine Bewerbung länger unbeantwortet bleibt</span></label>
        <div class="grid gap-1">
          <label for="p-report" class="font-semibold">E-Mail für den Monatsbericht <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="p-report" v-model="form.report_email" type="email" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.report_email" class="text-sm text-destructive">{{ errors.report_email }}</p>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Vorlagen</legend>
        <p class="text-sm text-muted-foreground">Platzhalter: {name}, {stelle}, {dienst}, {ansprechperson}, {telefon}. Leer lassen, um den Standardtext zu nutzen.</p>
        <div class="grid gap-1">
          <label for="p-inv" class="font-semibold">Einladung</label>
          <textarea id="p-inv" v-model="form.template_invite" rows="8" class="rounded-lg border border-border px-4 py-3 text-base" />
          <div><button type="button" class="text-sm underline" @click="form.template_invite = DEFAULT_TEMPLATE_INVITE">Standard einsetzen</button></div>
          <p v-if="errors.template_invite" class="text-sm text-destructive">{{ errors.template_invite }}</p>
        </div>
        <div class="grid gap-1">
          <label for="p-rej" class="font-semibold">Absage</label>
          <textarea id="p-rej" v-model="form.template_reject" rows="8" class="rounded-lg border border-border px-4 py-3 text-base" />
          <div><button type="button" class="text-sm underline" @click="form.template_reject = DEFAULT_TEMPLATE_REJECT">Standard einsetzen</button></div>
          <p v-if="errors.template_reject" class="text-sm text-destructive">{{ errors.template_reject }}</p>
        </div>
      </fieldset>

      <div class="grid gap-2">
        <p v-if="saved" class="rounded-lg bg-secondary p-3 text-sm" role="status">Gespeichert.</p>
        <p v-if="formError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{{ formError }}</p>
        <div><button type="submit" :disabled="saving" class="h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60">{{ saving ? 'Speichert …' : 'Speichern' }}</button></div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_TEMPLATE_INVITE, DEFAULT_TEMPLATE_REJECT } from '#shared/utils/templates'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const directusUrl = useRuntimeConfig().public.directusUrl as string
const empQuery = computed(() => ({ employer: route.query.employer }))
const { data, error } = await useFetch<any>('/api/portal/employer', { query: empQuery })

const FIELDS = ['name', 'legal_name', 'color_primary', 'color_secondary', 'address_street', 'address_zip', 'address_city', 'phone', 'website', 'apply_email', 'apply_whatsapp', 'service_area', 'about', 'schedule_model', 'template_invite', 'template_reject', 'report_email'] as const
const form = ref<any>(null)
const logoId = ref<string | null>(null)
function init(e: any) {
  if (!e) return
  const f: any = {}
  for (const k of FIELDS) f[k] = e[k] ?? ''
  f.notify_reminders = e.notify_reminders ?? true
  f.benefits = (e.benefits ?? []).map((b: any) => ({ label: b.label ?? '', detail: b.detail ?? '' }))
  form.value = f
  logoId.value = typeof e.logo === 'object' && e.logo ? e.logo.id : (e.logo ?? null)
}
init(data.value)

const errors = ref<Record<string, string>>({})
const formError = ref('')
const saved = ref(false)
const saving = ref(false)
async function save() {
  errors.value = {}; formError.value = ''; saved.value = false; saving.value = true
  try {
    await $fetch('/api/portal/employer', { method: 'PATCH', body: form.value, query: empQuery.value })
    saved.value = true
  } catch (e: any) {
    const fe = e?.data?.data
    if (e?.statusCode === 422 && fe) {
      for (const [k, v] of Object.entries(fe)) errors.value[k] = (v as string[])[0]
      formError.value = 'Bitte die markierten Felder prüfen.'
    } else formError.value = e?.data?.statusMessage || 'Das hat nicht geklappt. Bitte erneut versuchen.'
  } finally { saving.value = false }
}

const uploadError = ref('')
async function upload(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadError.value = ''
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res = await $fetch<{ id: string }>('/api/portal/upload', { method: 'POST', body: fd, query: empQuery.value })
    logoId.value = res.id
  } catch (e: any) {
    uploadError.value = e?.data?.statusMessage || 'Der Upload hat nicht geklappt.'
  } finally { input.value = '' }
}
</script>
