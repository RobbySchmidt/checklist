<template>
  <form class="grid gap-5" novalidate @submit.prevent="submit">
    <p v-if="done" class="rounded-xl bg-secondary p-5 text-lg" role="status">
      Danke, {{ form.name }}! {{ employer.name }} meldet sich innerhalb von 24 Stunden bei dir.
      <a v-if="previewId" :href="`/__mail/${previewId}`" target="_blank" class="block mt-2 text-sm underline">Mailvorschau öffnen (nur Entwicklung)</a>
    </p>
    <template v-else>
      <div class="grid gap-1">
        <label for="apply-name" class="font-semibold">Dein Name</label>
        <input id="apply-name" v-model="form.name" type="text" autocomplete="name" required class="h-12 rounded-lg border border-border px-4 text-base">
        <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-phone" class="font-semibold">Deine Telefonnummer</label>
        <input id="apply-phone" v-model="form.phone" type="tel" autocomplete="tel" inputmode="tel" required class="h-12 rounded-lg border border-border px-4 text-base">
        <p v-if="errors.phone" class="text-sm text-destructive">{{ errors.phone }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-qualification" class="font-semibold">Deine Qualifikation</label>
        <select id="apply-qualification" v-model="form.qualification" required class="h-12 rounded-lg border border-border px-4 text-base bg-background">
          <option value="" disabled>Bitte wählen</option>
          <option v-for="(label, key) in QUALIFICATION_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <p v-if="errors.qualification" class="text-sm text-destructive">{{ errors.qualification }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-hours" class="font-semibold">Wie viel möchtest du arbeiten?</label>
        <select id="apply-hours" v-model="form.hours_wish" required class="h-12 rounded-lg border border-border px-4 text-base bg-background">
          <option value="" disabled>Bitte wählen</option>
          <option v-for="(label, key) in HOURS_WISH_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <p v-if="errors.hours_wish" class="text-sm text-destructive">{{ errors.hours_wish }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-start" class="font-semibold">Ab wann? <span class="font-normal text-muted-foreground">(optional)</span></label>
        <input id="apply-start" v-model="form.earliest_start" type="text" placeholder="z. B. ab sofort, ab Januar" class="h-12 rounded-lg border border-border px-4 text-base">
      </div>
      <div class="grid gap-1">
        <label for="apply-message" class="font-semibold">Möchtest du noch etwas sagen? <span class="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="apply-message" v-model="form.message" rows="3" class="rounded-lg border border-border px-4 py-3 text-base" />
        <p v-if="errors.message" class="text-sm text-destructive">{{ errors.message }}</p>
      </div>
      <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden">
      <label class="flex items-start gap-3 text-sm">
        <input id="apply-consent" v-model="form.consent" type="checkbox" class="mt-1 h-5 w-5">
        <span>{{ employer.name }} darf mich zu dieser Bewerbung anrufen oder anschreiben. Mehr dazu in der <NuxtLink to="/datenschutz" class="underline">Datenschutzerklärung</NuxtLink>.</span>
      </label>
      <p v-if="errors.consent" class="text-sm text-destructive -mt-3">{{ errors.consent }}</p>
      <p v-if="errors._form" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{{ errors._form }}</p>
      <button type="submit" :disabled="busy" class="h-14 rounded-full bg-primary text-lg font-bold text-primary-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {{ busy ? 'Wird gesendet …' : 'Rückruf anfordern' }}
      </button>
    </template>
  </form>
</template>

<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from '#shared/utils/jobs'
import { applicationSchema, SOURCES } from '#shared/utils/applicationSchema'

const props = defineProps<{ job: Job; employer: Employer }>()
const route = useRoute()

const form = reactive({ name: '', phone: '', qualification: '', hours_wish: '', earliest_start: '', message: '', consent: false, website: '' })
const errors = reactive<Record<string, string>>({})
const busy = ref(false)
const done = ref(false)
const previewId = ref<string | null>(null)

const source = computed(() => {
  const s = String(route.query.src ?? '')
  return (SOURCES as readonly string[]).includes(s) ? s : 'direct'
})

async function submit() {
  for (const k of Object.keys(errors)) delete errors[k]
  const payload = { job: props.job.id, ...form, source: source.value }
  const parsed = applicationSchema.safeParse(payload)
  if (!parsed.success) {
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) errors[k] = v?.[0] ?? 'Bitte prüfen.'
    return
  }
  busy.value = true
  try {
    const res = await $fetch<{ ok: boolean; previewId?: string }>('/api/apply', { method: 'POST', body: { ...parsed.data, website: form.website } })
    previewId.value = res.previewId ?? null
    done.value = true
  } catch (err: any) {
    const data = err?.data?.data
    if (err?.statusCode === 422 && data) for (const [k, v] of Object.entries(data)) errors[k] = (v as string[])?.[0] ?? 'Bitte prüfen.'
    else if (err?.statusCode === 404) errors._form = 'Diese Stelle ist inzwischen nicht mehr verfügbar.'
    else if (err?.statusCode === 429) errors._form = 'Zu viele Bewerbungen von diesem Anschluss. Bitte später erneut versuchen.'
    else errors._form = `Gerade nicht möglich. Bitte rufen Sie an: ${props.employer.phone || props.employer.apply_email}`
  } finally {
    busy.value = false
  }
}
</script>
