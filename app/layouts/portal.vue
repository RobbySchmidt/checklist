<template>
  <div class="min-h-screen bg-background text-foreground md:grid md:grid-cols-[240px_1fr]">
    <aside class="border-b border-border bg-secondary/40 p-4 md:border-b-0 md:border-r md:min-h-screen">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portal</p>
      <p class="mt-1 font-bold truncate">{{ me?.employer?.name ?? '…' }}</p>
      <select v-if="me?.user.role === 'rhowerk' && me.employers?.length" :value="me.employer?.id" class="mt-2 w-full h-10 rounded-lg border border-border bg-background px-2 text-sm" @change="switchEmployer(($event.target as HTMLSelectElement).value)">
        <option v-for="e in me.employers" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
      <nav class="mt-4 grid gap-1 text-sm">
        <NuxtLink v-for="l in links" :key="l.to" :to="withEmployer(l.to)" class="rounded-lg px-3 py-2 hover:bg-secondary" active-class="bg-secondary font-semibold">{{ l.label }}</NuxtLink>
        <button type="button" class="mt-4 rounded-lg px-3 py-2 text-left text-muted-foreground hover:bg-secondary" @click="logout">Abmelden</button>
      </nav>
    </aside>
    <main class="p-4 md:p-8 min-w-0"><slot /></main>
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
// /api/portal/me entsteht in Task 7; bis dahin Fehler abfangen und „…“ anzeigen.
const { data: me } = await useFetch<any>('/api/portal/me', { query: computed(() => ({ employer: route.query.employer })), onResponseError: () => {} })
const links = [
  { to: '/portal', label: 'Übersicht' }, { to: '/portal/stellen', label: 'Stellen' },
  { to: '/portal/bewerbungen', label: 'Bewerbungen' }, { to: '/portal/profil', label: 'Profil' },
]
const withEmployer = (to: string) => (route.query.employer ? `${to}?employer=${route.query.employer}` : to)
function switchEmployer(id: string) { navigateTo({ path: route.path, query: { ...route.query, employer: id } }) }
async function logout() { await $fetch('/api/auth/logout', { method: 'POST' }); await useUserSession().clear(); navigateTo('/portal/login') }
</script>
