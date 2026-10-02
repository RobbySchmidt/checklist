<template>
  <div class="grid gap-6">
    <PortalPageHeader title="Profil" />
    <div v-if="error" class="portal-card p-4 opacity-75">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <form v-else-if="form" class="grid max-w-3xl gap-6" novalidate @submit.prevent="save">
      <fieldset class="portal-card grid gap-5 p-5">
        <legend class="sr-only">Dienst</legend>
        <div aria-hidden="true"><p class="portal-eyebrow">Abschnitt 1 von 5</p><h2 class="portal-display text-xl">Dienst</h2></div>
        <div class="grid gap-1">
          <label for="p-name" class="font-medium">Name</label>
          <input id="p-name" v-model="form.name" type="text" class="portal-input">
          <p v-if="errors.name" class="text-sm font-medium text-destructive">{{ errors.name }}</p>
        </div>
        <div class="grid gap-1">
          <label for="p-legal" class="font-medium">Rechtlicher Name <span class="font-normal opacity-75">(optional)</span></label>
          <input id="p-legal" v-model="form.legal_name" type="text" class="portal-input">
          <p v-if="errors.legal_name" class="text-sm font-medium text-destructive">{{ errors.legal_name }}</p>
        </div>
        <div class="grid gap-2">
          <span class="font-medium">Logo</span>
          <img v-if="logoId" :src="`${directusUrl}/assets/${logoId}?width=160`" alt="Aktuelles Logo" class="max-h-24 w-auto max-w-40 rounded border border-border bg-white p-2">
          <div v-if="logoId"><button type="button" class="inline-flex min-h-11 items-center text-sm font-medium underline" :disabled="removing" @click="removeLogo">Logo entfernen</button></div>
          <p v-else class="text-sm opacity-75">Noch kein Logo.</p>
          <p v-if="logoRemoved" class="text-sm font-medium" style="color: var(--portal-zusage-fg)" role="status">Logo entfernt</p>
          <label for="p-logo" class="text-sm opacity-75">PNG, JPG, SVG oder WebP, höchstens 2 MB. Wird sofort gespeichert.</label>
          <input id="p-logo" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" @change="upload">
          <p v-if="uploadError" class="text-sm font-medium text-destructive" role="alert">{{ uploadError }}</p>
        </div>
        <div class="grid gap-6">
          <div class="grid gap-1">
            <PortalColorField v-model="form.color_primary" label="Hauptfarbe" hint="Für Knöpfe und Gehaltsbalken auf der Stellenseite" />
            <p v-if="lowContrast" class="text-sm opacity-75">Weiße Schrift ist auf dieser Farbe schwer lesbar. Wählen Sie einen dunkleren Ton.</p>
            <p v-if="errors.color_primary" class="text-sm font-medium text-destructive">{{ errors.color_primary }}</p>
          </div>
          <div class="grid gap-1">
            <PortalColorField v-model="form.color_secondary" label="Zweitfarbe" hint="Helle Fläche für Chips und Hervorhebungen" />
            <p v-if="errors.color_secondary" class="text-sm font-medium text-destructive">{{ errors.color_secondary }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3" aria-label="Vorschau">
            <span class="inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-medium" :style="{ background: primaryPreview, color: readableText(primaryPreview) }">So sieht Ihr Bewerben-Knopf aus</span>
            <span class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium" :style="{ background: secondaryPreview, color: readableText(secondaryPreview) }">Vollzeit</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="portal-card grid gap-5 p-5">
        <legend class="sr-only">Kontakt</legend>
        <div aria-hidden="true"><p class="portal-eyebrow">Abschnitt 2 von 5</p><h2 class="portal-display text-xl">Kontakt</h2></div>
        <div class="grid gap-1">
          <label for="p-street" class="font-medium">Straße und Hausnummer</label>
          <input id="p-street" v-model="form.address_street" type="text" class="portal-input">
          <p v-if="errors.address_street" class="text-sm font-medium text-destructive">{{ errors.address_street }}</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="p-zip" class="font-medium">PLZ</label>
            <input id="p-zip" v-model="form.address_zip" type="text" inputmode="numeric" class="portal-input">
            <p v-if="errors.address_zip" class="text-sm font-medium text-destructive">{{ errors.address_zip }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-city" class="font-medium">Ort</label>
            <input id="p-city" v-model="form.address_city" type="text" class="portal-input">
            <p v-if="errors.address_city" class="text-sm font-medium text-destructive">{{ errors.address_city }}</p>
          </div>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="p-phone" class="font-medium">Telefon <span class="font-normal opacity-75">(optional)</span></label>
            <input id="p-phone" v-model="form.phone" type="tel" class="portal-input">
            <p v-if="errors.phone" class="text-sm font-medium text-destructive">{{ errors.phone }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-web" class="font-medium">Website <span class="font-normal opacity-75">(optional)</span></label>
            <input id="p-web" v-model="form.website" type="url" placeholder="https://" class="portal-input">
            <p v-if="errors.website" class="text-sm font-medium text-destructive">{{ errors.website }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-imprint" class="font-medium">Impressum-Link <span class="font-normal opacity-75">(optional)</span></label>
            <input id="p-imprint" v-model="form.imprint_url" type="url" placeholder="https://" class="portal-input">
            <p v-if="errors.imprint_url" class="text-sm font-medium text-destructive">{{ errors.imprint_url }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-privacy" class="font-medium">Datenschutz-Link <span class="font-normal opacity-75">(optional)</span></label>
            <input id="p-privacy" v-model="form.privacy_url" type="url" placeholder="https://" class="portal-input">
            <p v-if="errors.privacy_url" class="text-sm font-medium text-destructive">{{ errors.privacy_url }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-mail" class="font-medium">E-Mail für Bewerbungen</label>
            <input id="p-mail" v-model="form.apply_email" type="email" class="portal-input">
            <p v-if="errors.apply_email" class="text-sm font-medium text-destructive">{{ errors.apply_email }}</p>
          </div>
          <div class="grid gap-1">
            <label for="p-wa" class="font-medium">WhatsApp-Nummer <span class="font-normal opacity-75">(optional)</span></label>
            <input id="p-wa" v-model="form.apply_whatsapp" type="text" inputmode="numeric" placeholder="491511234567" class="portal-input">
            <p class="text-sm opacity-75">Nur Ziffern, international ohne Plus.</p>
            <p v-if="errors.apply_whatsapp" class="text-sm font-medium text-destructive">{{ errors.apply_whatsapp }}</p>
          </div>
        </div>
        <div class="grid gap-1">
          <label for="p-area" class="font-medium">Einsatzgebiet <span class="font-normal opacity-75">(optional)</span></label>
          <input id="p-area" v-model="form.service_area" type="text" class="portal-input">
          <p v-if="errors.service_area" class="text-sm font-medium text-destructive">{{ errors.service_area }}</p>
        </div>
      </fieldset>

      <fieldset class="portal-card grid gap-5 p-5">
        <legend class="sr-only">Arbeiten bei uns</legend>
        <div aria-hidden="true"><p class="portal-eyebrow">Abschnitt 3 von 5</p><h2 class="portal-display text-xl">Arbeiten bei uns</h2></div>
        <div class="grid gap-1">
          <label for="p-about" class="font-medium">Über uns</label>
          <textarea id="p-about" v-model="form.about" rows="4" class="portal-textarea" />
          <p v-if="errors.about" class="text-sm font-medium text-destructive">{{ errors.about }}</p>
        </div>
        <div class="grid gap-1">
          <label for="p-sched" class="font-medium">Dienstplan</label>
          <textarea id="p-sched" v-model="form.schedule_model" rows="3" class="portal-textarea" />
          <p v-if="errors.schedule_model" class="text-sm font-medium text-destructive">{{ errors.schedule_model }}</p>
        </div>
        <div class="grid gap-3">
          <span class="font-medium">Benefits</span>
          <div v-for="(b, i) in form.benefits" :key="i" class="portal-card grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" style="background: var(--portal-paper); box-shadow: none">
            <div class="grid gap-1">
              <label :for="`b-l-${i}`" class="text-sm font-medium">Titel</label>
              <input :id="`b-l-${i}`" v-model="b.label" type="text" class="portal-input !min-h-11 !px-3">
            </div>
            <div class="grid gap-1">
              <label :for="`b-d-${i}`" class="text-sm font-medium">Detail <span class="font-normal opacity-75">(optional)</span></label>
              <input :id="`b-d-${i}`" v-model="b.detail" type="text" class="portal-input !min-h-11 !px-3">
            </div>
            <button type="button" class="portal-btn" @click="form.benefits.splice(i, 1)">Entfernen</button>
          </div>
          <div><button v-if="form.benefits.length < 12" type="button" class="portal-btn" @click="form.benefits.push({ label: '', detail: '' })">Benefit hinzufügen</button></div>
          <p v-if="errors.benefits" class="text-sm font-medium text-destructive">{{ errors.benefits }}</p>
        </div>
      </fieldset>

      <fieldset class="portal-card grid gap-5 p-5">
        <legend class="sr-only">Benachrichtigungen</legend>
        <div aria-hidden="true"><p class="portal-eyebrow">Abschnitt 4 von 5</p><h2 class="portal-display text-xl">Benachrichtigungen</h2></div>
        <label class="flex min-h-11 items-center gap-3"><Checkbox v-model="form.notify_reminders" class="size-5" /><span>Erinnerung, wenn eine Bewerbung länger unbeantwortet bleibt</span></label>
        <div class="grid gap-1">
          <label for="p-report" class="font-medium">E-Mail für den Monatsbericht <span class="font-normal opacity-75">(optional)</span></label>
          <input id="p-report" v-model="form.report_email" type="email" class="portal-input">
          <p v-if="errors.report_email" class="text-sm font-medium text-destructive">{{ errors.report_email }}</p>
        </div>
      </fieldset>

      <fieldset class="portal-card grid gap-5 p-5">
        <legend class="sr-only">Vorlagen</legend>
        <div aria-hidden="true"><p class="portal-eyebrow">Abschnitt 5 von 5</p><h2 class="portal-display text-xl">Vorlagen</h2></div>
        <p class="text-sm opacity-75">Platzhalter: {name}, {stelle}, {dienst}, {ansprechperson}, {telefon}. Leer lassen, um den Standardtext zu nutzen.</p>
        <div class="grid gap-1">
          <label for="p-inv" class="font-medium">Einladung</label>
          <textarea id="p-inv" v-model="form.template_invite" rows="8" class="portal-textarea" />
          <div><button type="button" class="inline-flex min-h-11 items-center text-sm font-medium underline" @click="form.template_invite = DEFAULT_TEMPLATE_INVITE">Standard einsetzen</button></div>
          <p v-if="errors.template_invite" class="text-sm font-medium text-destructive">{{ errors.template_invite }}</p>
        </div>
        <div class="grid gap-1">
          <label for="p-rej" class="font-medium">Absage</label>
          <textarea id="p-rej" v-model="form.template_reject" rows="8" class="portal-textarea" />
          <div><button type="button" class="inline-flex min-h-11 items-center text-sm font-medium underline" @click="form.template_reject = DEFAULT_TEMPLATE_REJECT">Standard einsetzen</button></div>
          <p v-if="errors.template_reject" class="text-sm font-medium text-destructive">{{ errors.template_reject }}</p>
        </div>
      </fieldset>

      <p v-if="formError" class="rounded-lg p-3 text-sm" style="background: #fee2e2; color: var(--portal-danger)" role="alert">{{ formError }}</p>
      <div class="sticky bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-wrap items-center gap-3 border-t bg-white px-4 py-3 md:bottom-0 md:mx-0 md:rounded-b-xl" style="border-color: var(--portal-line)">
        <button type="submit" :disabled="saving" class="portal-btn portal-btn-primary">{{ saving ? 'Wird gespeichert …' : 'Profil speichern' }}<ArrowRight class="arrow" :size="19" aria-hidden="true" /></button>
        <span v-if="saved && !saving" class="inline-flex items-center gap-1 text-sm font-medium" style="color: var(--portal-zusage-fg)" role="status"><Check class="size-4" aria-hidden="true" />Gespeichert</span>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Check, ArrowRight } from 'lucide-vue-next'
import { Checkbox } from '~/components/ui/checkbox'
import { contrastRatio, isHex, portalTheme, readableText } from '#shared/utils/color'
import { DEFAULT_TEMPLATE_INVITE, DEFAULT_TEMPLATE_REJECT } from '#shared/utils/templates'

definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const directusUrl = useRuntimeConfig().public.directusUrl as string
const empQuery = computed(() => ({ employer: route.query.employer }))
const { data, error } = await useFetch<any>('/api/portal/employer', { query: empQuery })

const FIELDS = ['name', 'legal_name', 'color_primary', 'color_secondary', 'address_street', 'address_zip', 'address_city', 'phone', 'website', 'imprint_url', 'privacy_url', 'apply_email', 'apply_whatsapp', 'service_area', 'about', 'schedule_model', 'template_invite', 'template_reject', 'report_email'] as const
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
const primaryPreview = computed(() => (form.value && isHex(form.value.color_primary) ? form.value.color_primary : '#1d6b57'))
const secondaryPreview = computed(() => (form.value && isHex(form.value.color_secondary) ? form.value.color_secondary : '#dcefe7'))
const lowContrast = computed(() => !!form.value && isHex(form.value.color_primary) && contrastRatio('#ffffff', form.value.color_primary) < 4.5)

const theme = useState<Record<string, string>>('portalTheme', () => ({}))
const savedColors = { primary: data.value?.color_primary ?? '', secondary: data.value?.color_secondary ?? '' }
watch(() => [form.value?.color_primary, form.value?.color_secondary], ([p, s]) => { if (form.value) theme.value = portalTheme(p, s) })
onBeforeUnmount(() => { theme.value = portalTheme(savedColors.primary, savedColors.secondary) })

const errors = ref<Record<string, string>>({})
const formError = ref('')
const saved = ref(false)
const saving = ref(false)
async function save() {
  errors.value = {}; formError.value = ''; saved.value = false; saving.value = true
  try {
    await $fetch('/api/portal/employer', { method: 'PATCH', body: form.value, query: empQuery.value })
    saved.value = true
    savedColors.primary = form.value.color_primary; savedColors.secondary = form.value.color_secondary
  } catch (e: any) {
    const fe = e?.data?.data
    if (e?.statusCode === 422 && fe) {
      for (const [k, v] of Object.entries(fe)) errors.value[k] = (v as string[])[0] ?? ''
      formError.value = 'Bitte die markierten Felder prüfen.'
    } else formError.value = e?.data?.statusMessage || 'Das hat nicht geklappt. Bitte erneut versuchen.'
  } finally { saving.value = false }
}

const removing = ref(false)
const logoRemoved = ref(false)
const uploadError = ref('')
async function removeLogo() {
  removing.value = true; uploadError.value = ''; logoRemoved.value = false
  try {
    await $fetch('/api/portal/employer', { method: 'PATCH', body: { logo: null }, query: empQuery.value })
    logoId.value = null; logoRemoved.value = true
  } catch (e: any) {
    uploadError.value = e?.data?.statusMessage || 'Das Logo ließ sich nicht entfernen.'
  } finally { removing.value = false }
}
async function upload(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadError.value = ''
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res = await $fetch<{ id: string }>('/api/portal/upload', { method: 'POST', body: fd, query: empQuery.value })
    logoId.value = res.id; logoRemoved.value = false; logoRemoved.value = false
  } catch (e: any) {
    uploadError.value = e?.data?.statusMessage || 'Der Upload hat nicht geklappt.'
  } finally { input.value = '' }
}
</script>
