<template>
  <div class="mx-auto max-w-md px-4 py-16 grid gap-6">
    <h1 class="text-2xl font-bold">Anmelden</h1>
    <p v-if="state === 'consuming'" class="text-muted-foreground">Link wird geprüft …</p>
    <p v-else-if="state === 'error'" class="rounded-lg bg-destructive/10 p-3 text-destructive">Link ungültig oder abgelaufen. Bitte neuen Link anfordern.</p>
    <p v-if="state === 'sent'" class="rounded-lg bg-secondary p-4" role="status">Wenn die Adresse bekannt ist, haben wir einen Link geschickt. Er gilt 15 Minuten.
      <a v-if="previewId" :href="`/__mail/${previewId}`" target="_blank" class="block mt-2 text-sm underline">Mailvorschau öffnen (nur Entwicklung)</a></p>
    <form v-if="state !== 'sent' && state !== 'consuming'" class="grid gap-3" @submit.prevent="request">
      <label for="login-email" class="font-semibold">Ihre E-Mail-Adresse</label>
      <input id="login-email" v-model="email" type="email" required autocomplete="email" class="h-12 rounded-lg border border-border px-4 text-base">
      <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>
      <button type="submit" :disabled="busy" class="h-12 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-60">Link senden</button>
    </form>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'bare' })
const route = useRoute()
const email = ref('')
const busy = ref(false)
const formError = ref('')
const previewId = ref<string | null>(null)
const state = ref<'idle' | 'sent' | 'consuming' | 'error'>(route.query.token ? 'consuming' : 'idle')

onMounted(async () => {
  const token = route.query.token
  if (!token) return
  try {
    await $fetch('/api/auth/consume', { method: 'POST', body: { token } })
    await useUserSession().fetch()
    navigateTo(String(route.query.next || '/portal'))
  } catch { state.value = 'error' }
})
async function request() {
  busy.value = true; formError.value = ''
  try {
    const res = await $fetch<{ ok: boolean; previewId?: string }>('/api/auth/request-link', { method: 'POST', body: { email: email.value } })
    previewId.value = res.previewId ?? null
    state.value = 'sent'
  } catch (err: any) {
    formError.value = err?.statusCode === 503 ? 'Mail konnte nicht gesendet werden, bitte später erneut versuchen.' : 'Gerade nicht möglich.'
  } finally { busy.value = false }
}
useSeoMeta({ title: 'Anmelden', robots: 'noindex' })
</script>
