<template>
  <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
    <form class="space-y-10" novalidate @submit.prevent="submit">
      <fieldset class="space-y-4">
        <legend class="sr-only">Grunddaten</legend>
        <h2 class="portal-display text-xl leading-tight" aria-hidden="true">Grunddaten</h2>
        <div class="grid gap-1">
          <label for="job-title" class="text-sm font-medium">Titel</label>
          <input id="job-title" v-model="form.title" type="text" required class="portal-input">
          <p v-if="errors.title" class="text-sm font-medium text-destructive">{{ errors.title }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-slug" class="text-sm font-medium">URL-Name</label>
          <input id="job-slug" v-model="form.slug" type="text" required class="portal-input" @input="slugTouched = true">
          <p class="text-sm opacity-75">Die Stelle ist erreichbar unter /jobs/{{ form.slug || '…' }}</p>
          <p v-if="errors.slug" class="text-sm font-medium text-destructive">{{ errors.slug }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-status" class="text-sm font-medium">Stand</label>
          <Select v-model="form.status">
            <SelectTrigger id="job-status" class="portal-input !h-12 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem v-for="(label, key) in STATUS_LABELS" :key="key" :value="String(key)">{{ label }}</SelectItem></SelectContent>
          </Select>
          <p v-if="errors.status" class="text-sm font-medium text-destructive">{{ errors.status }}</p>
        </div>
        <div class="grid gap-1">
          <span class="text-sm font-medium">Beschäftigungsart</span>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label v-for="(label, key) in EMPLOYMENT_TYPE_LABELS" :key="key" class="flex min-h-11 items-center gap-2">
              <Checkbox :model-value="form.employment_types.includes(key)" class="size-5" @update:model-value="toggleType(String(key), $event === true)" />{{ label }}
            </label>
          </div>
          <p v-if="errors.employment_types" class="text-sm font-medium text-destructive">{{ errors.employment_types }}</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="job-hmin" class="text-sm font-medium">Stunden pro Woche von <span class="font-normal opacity-75">(optional)</span></label>
            <input id="job-hmin" v-model="form.hours_min" type="number" min="1" max="60" inputmode="numeric" class="portal-input">
            <p v-if="errors.hours_min" class="text-sm font-medium text-destructive">{{ errors.hours_min }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-hmax" class="text-sm font-medium">bis <span class="font-normal opacity-75">(optional)</span></label>
            <input id="job-hmax" v-model="form.hours_max" type="number" min="1" max="60" inputmode="numeric" class="portal-input">
            <p v-if="errors.hours_max" class="text-sm font-medium text-destructive">{{ errors.hours_max }}</p>
          </div>
        </div>
        <div class="grid gap-1">
          <label for="job-start" class="text-sm font-medium">Beginn <span class="font-normal opacity-75">(optional)</span></label>
          <input id="job-start" v-model="form.start_note" type="text" placeholder="z. B. ab sofort" class="portal-input">
          <p v-if="errors.start_note" class="text-sm font-medium text-destructive">{{ errors.start_note }}</p>
        </div>
        <label class="flex min-h-11 items-center gap-3">
          <Checkbox v-model="otherLocation" class="size-5" />
          <span>Anderer Einsatzort als die Adresse des Dienstes</span>
        </label>
        <div v-if="otherLocation" class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1 sm:col-span-2">
            <label for="job-street" class="text-sm font-medium">Straße und Hausnummer</label>
            <input id="job-street" v-model="loc.street" type="text" class="portal-input">
          </div>
          <div class="grid gap-1">
            <label for="job-zip" class="text-sm font-medium">PLZ</label>
            <input id="job-zip" v-model="loc.zip" type="text" inputmode="numeric" class="portal-input">
          </div>
          <div class="grid gap-1">
            <label for="job-city" class="text-sm font-medium">Ort</label>
            <input id="job-city" v-model="loc.city" type="text" class="portal-input">
          </div>
          <p v-if="errors.location_override" class="text-sm font-medium text-destructive sm:col-span-2">{{ errors.location_override }}</p>
        </div>
      </fieldset>

      <fieldset class="space-y-4">
        <legend class="sr-only">Gehalt</legend>
        <h2 class="portal-display text-xl leading-tight" aria-hidden="true">Gehalt</h2>
        <div class="grid gap-5 sm:grid-cols-3">
          <div class="grid gap-1">
            <label for="job-smin" class="text-sm font-medium">von (€)</label>
            <input id="job-smin" v-model="form.salary_min" type="number" min="0" step="any" inputmode="decimal" class="portal-input">
            <p v-if="errors.salary_min" class="text-sm font-medium text-destructive">{{ errors.salary_min }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-smax" class="text-sm font-medium">bis (€)</label>
            <input id="job-smax" v-model="form.salary_max" type="number" min="0" step="any" inputmode="decimal" class="portal-input">
            <p v-if="errors.salary_max" class="text-sm font-medium text-destructive">{{ errors.salary_max }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-sunit" class="text-sm font-medium">pro</label>
            <Select v-model="form.salary_unit">
              <SelectTrigger id="job-sunit" class="portal-input !h-12 w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="MONTH">Monat</SelectItem><SelectItem value="HOUR">Stunde</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div class="grid gap-1">
          <label for="job-snote" class="text-sm font-medium">Hinweis zum Gehalt <span class="font-normal opacity-75">(optional)</span></label>
          <input id="job-snote" v-model="form.salary_note" type="text" placeholder="z. B. nach Tarif, plus Zuschläge" class="portal-input">
          <p v-if="errors.salary_note" class="text-sm font-medium text-destructive">{{ errors.salary_note }}</p>
        </div>
      </fieldset>

      <fieldset class="space-y-4">
        <legend class="sr-only">Inhalt</legend>
        <h2 class="portal-display text-xl leading-tight" aria-hidden="true">Inhalt</h2>
        <div class="grid gap-1">
          <label for="job-intro" class="text-sm font-medium">Einleitung <span class="font-normal opacity-75">(optional)</span></label>
          <textarea id="job-intro" v-model="form.intro" rows="3" class="portal-textarea" />
          <p v-if="errors.intro" class="text-sm font-medium text-destructive">{{ errors.intro }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-tasks" class="text-sm font-medium">Aufgaben</label>
          <textarea id="job-tasks" v-model="tasksText" rows="5" class="portal-textarea" />
          <p class="text-sm opacity-75">Eine Zeile pro Punkt.</p>
          <p v-if="errors.tasks" class="text-sm font-medium text-destructive">{{ errors.tasks }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-req" class="text-sm font-medium">Voraussetzungen</label>
          <textarea id="job-req" v-model="requirementsText" rows="5" class="portal-textarea" />
          <p class="text-sm opacity-75">Eine Zeile pro Punkt.</p>
          <p v-if="errors.requirements" class="text-sm font-medium text-destructive">{{ errors.requirements }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-contact" class="text-sm font-medium">Ansprechperson <span class="font-normal opacity-75">(optional)</span></label>
          <input id="job-contact" v-model="form.contact_name" type="text" class="portal-input">
          <p v-if="errors.contact_name" class="text-sm font-medium text-destructive">{{ errors.contact_name }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-email" class="text-sm font-medium">Eigene Bewerbungs-E-Mail <span class="font-normal opacity-75">(optional)</span></label>
          <input id="job-email" v-model="form.apply_email_override" type="email" class="portal-input">
          <p v-if="errors.apply_email_override" class="text-sm font-medium text-destructive">{{ errors.apply_email_override }}</p>
        </div>
      </fieldset>

      <fieldset class="space-y-4">
        <legend class="sr-only">Laufzeit</legend>
        <h2 class="portal-display text-xl leading-tight" aria-hidden="true">Laufzeit</h2>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="job-posted" class="text-sm font-medium">Veröffentlicht am</label>
            <input id="job-posted" v-model="form.date_posted" type="date" class="portal-input">
            <p v-if="errors.date_posted" class="text-sm font-medium text-destructive">{{ errors.date_posted }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-valid" class="text-sm font-medium">Gültig bis</label>
            <input id="job-valid" v-model="form.valid_through" type="date" class="portal-input">
            <p v-if="errors.valid_through" class="text-sm font-medium text-destructive">{{ errors.valid_through }}</p>
          </div>
        </div>
      </fieldset>

      <p v-if="errors._form" class="rounded-lg p-3 text-sm" style="background: #fee2e2; color: var(--portal-danger)" role="alert">{{ errors._form }}</p>
      <div class="sticky bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-wrap items-center gap-3 border-t bg-white px-4 py-3 md:bottom-0 md:mx-0" style="border-color: var(--portal-line)">
        <button type="submit" :disabled="busy" class="portal-btn portal-btn-primary !min-h-12 !px-6">{{ busy ? 'Wird gespeichert …' : 'Stelle speichern' }}</button>
        <span v-if="saved && !busy" class="inline-flex items-center gap-1 text-sm font-medium" style="color: var(--portal-zusage-fg)" role="status"><Check class="size-4" aria-hidden="true" />Gespeichert</span>
      </div>
    </form>

    <aside class="hidden lg:block">
      <div class="sticky top-8 space-y-4">
        <h2 class="portal-display text-xl leading-tight">Google-Markup: {{ requiredOk }} von {{ check.required.length }} Pflichtfeldern</h2>
        <p class="text-sm font-medium" :style="{ color: check.ok ? 'var(--portal-zusage-fg)' : 'var(--portal-danger)' }">{{ check.ok ? 'Alle Pflichtfelder sind ausgefüllt.' : 'Es fehlen Pflichtfelder.' }}</p>
        <ul class="grid gap-1 text-sm">
          <li v-for="i in check.required" :key="i.key" class="flex items-center gap-2">
            <span class="size-2.5 shrink-0 rounded-full" :style="{ background: i.ok ? 'var(--portal-zusage-fg)' : 'var(--portal-danger)' }" aria-hidden="true" /><span class="sr-only">{{ i.ok ? 'erfüllt:' : 'fehlt:' }}</span>{{ i.label }}
          </li>
        </ul>
        <p class="text-sm opacity-75">Empfohlen</p>
        <ul class="grid gap-1 text-sm">
          <li v-for="i in check.recommended" :key="i.key" class="flex items-center gap-2">
            <span class="size-2.5 shrink-0 rounded-full" :style="{ background: i.ok ? 'var(--portal-zusage-fg)' : 'var(--portal-neu-fg)' }" aria-hidden="true" /><span class="sr-only">{{ i.ok ? 'erfüllt:' : 'empfohlen:' }}</span>{{ i.label }}
          </li>
        </ul>
        <p v-if="!hasSalary" class="text-sm opacity-75">Stellen mit Gehalt werden häufiger angezeigt.</p>
        <p v-if="!hasLogo" class="text-sm opacity-75">Logo im Profil hinterlegen.</p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { Checkbox } from '~/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { Employer, Job } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS } from '#shared/utils/jobs'
import { jobSchema, slugify, linesToList, listToLines } from '#shared/utils/jobSchema'
import type { JobInput } from '#shared/utils/jobSchema'
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { checkJobPosting } from '#shared/utils/jobPostingCheck'

const props = defineProps<{ modelValue: Partial<JobInput>; employer: Employer; busy: boolean; errors: Record<string, string>; saved?: boolean }>()
const emit = defineEmits<{ submit: [data: JobInput] }>()
const pub = useRuntimeConfig().public

const STATUS_LABELS = { draft: 'Entwurf', published: 'Veröffentlicht', filled: 'Besetzt', expired: 'Abgelaufen' } as const

const mv = props.modelValue
const form = reactive<Record<string, any>>({
  title: '', slug: '', status: 'draft', hours_min: null, hours_max: null, start_note: '',
  salary_min: null, salary_max: null, salary_unit: 'MONTH', salary_note: '', intro: '', contact_name: '', date_posted: '', valid_through: '',
  apply_email_override: '',
  ...mv,
  employment_types: [...(mv.employment_types ?? ['FULL_TIME'])],
})
const tasksText = ref(listToLines(mv.tasks ?? ''))
const requirementsText = ref(listToLines(mv.requirements ?? ''))
const otherLocation = ref(!!mv.location_override)
const loc = reactive({ street: mv.location_override?.street ?? '', zip: mv.location_override?.zip ?? '', city: mv.location_override?.city ?? '' })
const slugTouched = ref(!!mv.slug)
watch(() => form.title, (t) => { if (!slugTouched.value) form.slug = slugify(t) })

const payload = (): Record<string, any> => ({
  ...form,
  tasks: linesToList(tasksText.value),
  requirements: linesToList(requirementsText.value),
  location_override: otherLocation.value ? { ...loc } : null,
})

const localErrors = reactive<Record<string, string>>({})
const errors = computed(() => ({ ...localErrors, ...props.errors }))

const num = (v: any) => (v === '' || v === null || v === undefined ? null : Number(v))
const previewJob = computed(() => {
  const p = payload()
  return { ...p, id: 'preview', employer: props.employer.id, salary_min: num(p.salary_min), salary_max: num(p.salary_max), hours_min: num(p.hours_min), hours_max: num(p.hours_max) } as unknown as Job
})
const logoUrl = computed(() => {
  const logo = props.employer.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}` : null
})
const check = computed(() => checkJobPosting(buildJobPosting({ job: previewJob.value, employer: props.employer, siteUrl: pub.siteUrl as string, logoUrl: logoUrl.value })))
const requiredOk = computed(() => check.value.required.filter(i => i.ok).length)
function toggleType(key: string, on: boolean) {
  const i = form.employment_types.indexOf(key)
  if (on && i < 0) form.employment_types.push(key)
  else if (!on && i >= 0) form.employment_types.splice(i, 1)
}
const hasSalary = computed(() => num(form.salary_min) !== null)
const hasLogo = computed(() => !!logoUrl.value)

function submit() {
  for (const k of Object.keys(localErrors)) delete localErrors[k]
  const parsed = jobSchema.safeParse(payload())
  if (!parsed.success) {
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) localErrors[k] = (v as string[] | undefined)?.[0] ?? 'Bitte prüfen.'
    return
  }
  emit('submit', parsed.data)
}
</script>
