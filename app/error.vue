<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background: #f8f9fa; color: #15221d; font-family: Roboto, Arial, sans-serif;">
    <div class="w-full max-w-md rounded-lg border bg-white p-8" style="border-color: #e3e8e5;">
      <h1 class="text-xl font-medium leading-tight">{{ title }}</h1>
      <p class="mt-3 text-base" style="color: #5a6b64;">{{ text }}</p>
      <NuxtLink
        :to="target"
        class="mt-6 inline-flex min-h-11 items-center rounded-full px-5 text-base font-medium"
        style="background: #13392d; color: #ffffff;"
        @click="clearError()">
        {{ label }}
      </NuxtLink>
      <p v-if="error?.statusCode && error.statusCode !== 404" class="mt-4 text-sm" style="color: #5a6b64;">Fehler {{ error.statusCode }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; statusMessage?: string; url?: string } }>()
const route = useRoute()
const isJob = computed(() => (props.error?.url || route.path || '').startsWith('/jobs'))
const isPortal = computed(() => (props.error?.url || route.path || '').startsWith('/portal'))

const title = computed(() => {
  if (props.error?.statusCode === 503) return 'Gerade nicht erreichbar'
  if (props.error?.statusCode === 404) return isJob.value ? 'Diese Stelle ist nicht mehr verfügbar' : 'Seite nicht gefunden'
  return 'Da ist etwas schiefgelaufen'
})
const text = computed(() => {
  if (props.error?.statusCode === 503) return 'Bitte versuchen Sie es in ein paar Minuten noch einmal.'
  if (props.error?.statusCode === 404) return isJob.value ? 'Vielleicht ist sie schon besetzt. Alle offenen Stellen finden Sie in der Übersicht.' : 'Die Adresse gibt es nicht oder nicht mehr.'
  return 'Bitte versuchen Sie es gleich noch einmal.'
})
const target = computed(() => (isPortal.value ? '/portal' : '/jobs'))
const label = computed(() => (isPortal.value ? 'Zum Portal' : 'Offene Stellen'))
useSeoMeta({ title: () => title.value, robots: 'noindex' })
</script>
