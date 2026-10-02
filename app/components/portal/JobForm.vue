<template>
  <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
    <form class="grid gap-8" novalidate @submit.prevent="submit">
      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Grunddaten</legend>
        <div class="grid gap-1">
          <label for="job-title" class="font-semibold">Titel</label>
          <input id="job-title" v-model="form.title" type="text" required class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.title" class="text-sm text-destructive">{{ errors.title }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-slug" class="font-semibold">URL-Name</label>
          <input id="job-slug" v-model="form.slug" type="text" required class="h-12 rounded-lg border border-border px-4 text-base" @input="slugTouched = true">
          <p class="text-sm text-muted-foreground">Die Stelle ist erreichbar unter /jobs/{{ form.slug || '…' }}</p>
          <p v-if="errors.slug" class="text-sm text-destructive">{{ errors.slug }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-status" class="font-semibold">Stand</label>
          <select id="job-status" v-model="form.status" class="h-12 rounded-lg border border-border bg-background px-4 text-base">
            <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
          <p v-if="errors.status" class="text-sm text-destructive">{{ errors.status }}</p>
        </div>
        <div class="grid gap-1">
          <span class="font-semibold">Beschäftigungsart</span>
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <label v-for="(label, key) in EMPLOYMENT_TYPE_LABELS" :key="key" class="flex items-center gap-2">
              <input v-model="form.employment_types" type="checkbox" :value="key" class="h-5 w-5">{{ label }}
            </label>
          </div>
          <p v-if="errors.employment_types" class="text-sm text-destructive">{{ errors.employment_types }}</p>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="job-hmin" class="font-semibold">Stunden pro Woche von <span class="font-normal text-muted-foreground">(optional)</span></label>
            <input id="job-hmin" v-model="form.hours_min" type="number" min="1" max="60" inputmode="numeric" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.hours_min" class="text-sm text-destructive">{{ errors.hours_min }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-hmax" class="font-semibold">bis <span class="font-normal text-muted-foreground">(optional)</span></label>
            <input id="job-hmax" v-model="form.hours_max" type="number" min="1" max="60" inputmode="numeric" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.hours_max" class="text-sm text-destructive">{{ errors.hours_max }}</p>
          </div>
        </div>
        <div class="grid gap-1">
          <label for="job-start" class="font-semibold">Beginn <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="job-start" v-model="form.start_note" type="text" placeholder="z. B. ab sofort" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.start_note" class="text-sm text-destructive">{{ errors.start_note }}</p>
        </div>
        <label class="flex items-center gap-3">
          <input v-model="otherLocation" type="checkbox" class="h-5 w-5">
          <span>Anderer Einsatzort als die Adresse des Dienstes</span>
        </label>
        <div v-if="otherLocation" class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1 sm:col-span-2">
            <label for="job-street" class="font-semibold">Straße und Hausnummer</label>
            <input id="job-street" v-model="loc.street" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          </div>
          <div class="grid gap-1">
            <label for="job-zip" class="font-semibold">PLZ</label>
            <input id="job-zip" v-model="loc.zip" type="text" inputmode="numeric" class="h-12 rounded-lg border border-border px-4 text-base">
          </div>
          <div class="grid gap-1">
            <label for="job-city" class="font-semibold">Ort</label>
            <input id="job-city" v-model="loc.city" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          </div>
          <p v-if="errors.location_override" class="text-sm text-destructive sm:col-span-2">{{ errors.location_override }}</p>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Gehalt</legend>
        <div class="grid gap-5 sm:grid-cols-3">
          <div class="grid gap-1">
            <label for="job-smin" class="font-semibold">von (€)</label>
            <input id="job-smin" v-model="form.salary_min" type="number" min="0" step="any" inputmode="decimal" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.salary_min" class="text-sm text-destructive">{{ errors.salary_min }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-smax" class="font-semibold">bis (€)</label>
            <input id="job-smax" v-model="form.salary_max" type="number" min="0" step="any" inputmode="decimal" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.salary_max" class="text-sm text-destructive">{{ errors.salary_max }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-sunit" class="font-semibold">pro</label>
            <select id="job-sunit" v-model="form.salary_unit" class="h-12 rounded-lg border border-border bg-background px-4 text-base">
              <option value="MONTH">Monat</option>
              <option value="HOUR">Stunde</option>
            </select>
          </div>
        </div>
        <div class="grid gap-1">
          <label for="job-snote" class="font-semibold">Hinweis zum Gehalt <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="job-snote" v-model="form.salary_note" type="text" placeholder="z. B. nach Tarif, plus Zuschläge" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.salary_note" class="text-sm text-destructive">{{ errors.salary_note }}</p>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Inhalt</legend>
        <div class="grid gap-1">
          <label for="job-intro" class="font-semibold">Einleitung <span class="font-normal text-muted-foreground">(optional)</span></label>
          <textarea id="job-intro" v-model="form.intro" rows="3" class="rounded-lg border border-border px-4 py-3 text-base" />
          <p v-if="errors.intro" class="text-sm text-destructive">{{ errors.intro }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-tasks" class="font-semibold">Aufgaben</label>
          <textarea id="job-tasks" v-model="tasksText" rows="5" class="rounded-lg border border-border px-4 py-3 text-base" />
          <p class="text-sm text-muted-foreground">Eine Zeile pro Punkt.</p>
          <p v-if="errors.tasks" class="text-sm text-destructive">{{ errors.tasks }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-req" class="font-semibold">Voraussetzungen</label>
          <textarea id="job-req" v-model="requirementsText" rows="5" class="rounded-lg border border-border px-4 py-3 text-base" />
          <p class="text-sm text-muted-foreground">Eine Zeile pro Punkt.</p>
          <p v-if="errors.requirements" class="text-sm text-destructive">{{ errors.requirements }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-contact" class="font-semibold">Ansprechperson <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="job-contact" v-model="form.contact_name" type="text" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.contact_name" class="text-sm text-destructive">{{ errors.contact_name }}</p>
        </div>
        <div class="grid gap-1">
          <label for="job-email" class="font-semibold">Eigene Bewerbungs-E-Mail <span class="font-normal text-muted-foreground">(optional)</span></label>
          <input id="job-email" v-model="form.apply_email_override" type="email" class="h-12 rounded-lg border border-border px-4 text-base">
          <p v-if="errors.apply_email_override" class="text-sm text-destructive">{{ errors.apply_email_override }}</p>
        </div>
      </fieldset>

      <fieldset class="grid gap-5">
        <legend class="mb-1 text-xl font-bold">Laufzeit</legend>
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="grid gap-1">
            <label for="job-posted" class="font-semibold">Veröffentlicht am</label>
            <input id="job-posted" v-model="form.date_posted" type="date" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.date_posted" class="text-sm text-destructive">{{ errors.date_posted }}</p>
          </div>
          <div class="grid gap-1">
            <label for="job-valid" class="font-semibold">Gültig bis</label>
            <input id="job-valid" v-model="form.valid_through" type="date" class="h-12 rounded-lg border border-border px-4 text-base">
            <p v-if="errors.valid_through" class="text-sm text-destructive">{{ errors.valid_through }}</p>
          </div>
        </div>
      </fieldset>

      <p v-if="errors._form" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{{ errors._form }}</p>
      <button type="submit" :disabled="busy" class="h-14 rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:justify-self-start">
        {{ busy ? 'Wird gespeichert …' : 'Speichern' }}
      </button>
    </form>

    <aside class="hidden lg:block">
      <div class="sticky top-8 grid gap-4 rounded-xl border border-border p-4">
        <h2 class="text-lg font-bold">Google-Markup</h2>
        <p class="text-sm" :class="check.ok ? 'text-green-700' : 'text-destructive'">{{ check.ok ? 'Alle Pflichtfelder sind ausgefüllt.' : 'Es fehlen Pflichtfelder.' }}</p>
        <ul class="grid gap-1 text-sm">
          <li v-for="i in check.required" :key="i.key" class="flex items-center gap-2" :class="i.ok ? 'text-green-700' : 'text-destructive'">
            <span aria-hidden="true">{{ i.ok ? '✓' : '✗' }}</span>{{ i.label }}
          </li>
        </ul>
        <p class="text-sm font-semibold">Empfohlen</p>
        <ul class="grid gap-1 text-sm">
          <li v-for="i in check.recommended" :key="i.key" class="flex items-center gap-2" :class="i.ok ? 'text-green-700' : 'text-yellow-700'">
            <span aria-hidden="true">{{ i.ok ? '✓' : '!' }}</span>{{ i.label }}
          </li>
        </ul>
        <p v-if="!hasSalary" class="text-sm text-muted-foreground">Stellen mit Gehalt werden häufiger angezeigt.</p>
        <p v-if="!hasLogo" class="text-sm text-muted-foreground">Logo im Profil hinterlegen.</p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { Employer, Job } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS } from '#shared/utils/jobs'
import { jobSchema, slugify, linesToList, listToLines } from '#shared/utils/jobSchema'
import type { JobInput } from '#shared/utils/jobSchema'
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { checkJobPosting } from '#shared/utils/jobPostingCheck'

const props = defineProps<{ modelValue: Partial<JobInput>; employer: Employer; busy: boolean; errors: Record<string, string> }>()
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
