<template>
  <div class="portal grid min-h-screen place-items-center px-4 py-10" style="background: var(--portal-ink)">
    <div class="portal-card grid w-full max-w-md gap-6 p-6 sm:p-8">
      <div>
        <p class="portal-display text-xl leading-tight">pflege-jobs</p>
        <p class="mt-1 text-sm opacity-75">Portal für Pflegedienste</p>
      </div>
      <h1 class="portal-display text-3xl leading-tight md:text-4xl">Anmelden</h1>
      <p v-if="state === 'consuming'" class="opacity-75">Link wird geprüft …</p>
      <p v-else-if="state === 'error'" class="rounded-lg p-3 font-medium" style="background: #fee2e2; color: var(--portal-danger)">Link ungültig oder abgelaufen. Bitte neuen Link anfordern.</p>
      <p v-if="state === 'sent'" class="rounded-lg p-4" style="background: var(--portal-zusage-bg); color: var(--portal-zusage-fg)" role="status">Wenn die Adresse bekannt ist, haben wir einen Link geschickt. Er gilt 15 Minuten.
        <a v-if="previewId" :href="`/__mail/${previewId}`" target="_blank" class="mt-2 block text-sm underline">Mailvorschau öffnen (nur Entwicklung)</a></p>
      <form v-if="state !== 'sent' && state !== 'consuming'" class="grid gap-3" @submit.prevent="submit">
        <label for="login-email" class="text-sm font-medium">Ihre E-Mail-Adresse</label>
        <input id="login-email" v-model="email" type="email" required autocomplete="email" class="portal-input">
        <label for="login-password" class="text-sm font-medium">Passwort (optional)</label>
        <input id="login-password" v-model="password" type="password" autocomplete="current-password" class="portal-input">
        <p class="text-sm opacity-75">Ohne Passwort schicken wir Ihnen einen Anmeldelink.</p>
        <p v-if="formError" class="text-sm font-medium" style="color: var(--portal-danger)">{{ formError }}</p>
        <button type="submit" :disabled="busy" class="portal-btn portal-btn-primary !min-h-12">{{ password ? 'Anmelden' : 'Link senden' }}</button>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'bare' })
const route = useRoute()
const email = ref('')
const password = ref('')
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
async function submit() {
  if (!password.value) return request()
  busy.value = true; formError.value = ''
  try {
    await $fetch('/api/auth/password', { method: 'POST', body: { email: email.value, password: password.value } })
    await useUserSession().fetch()
    await navigateTo(String(route.query.next || '/portal'))
  } catch (err: any) {
    formError.value = err?.statusCode === 401 ? 'E-Mail oder Passwort falsch.' : err?.statusCode === 429 ? 'Zu viele Versuche. Bitte später erneut oder Link anfordern.' : 'Gerade nicht möglich.'
  } finally { busy.value = false }
}
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
