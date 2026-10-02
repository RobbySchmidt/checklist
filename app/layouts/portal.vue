<template>
  <div class="portal min-h-screen md:grid md:grid-cols-[248px_1fr]">
    <!-- Desktop: Seitenleiste -->
    <aside class="hidden md:sticky md:top-0 md:flex md:h-screen md:flex-col p-5" style="background: var(--portal-ink); color: var(--portal-white)">
      <p class="portal-display text-xl" style="color: var(--portal-white)">pflege-jobs</p>
      <PortalEmployerSwitch v-if="canSwitch" class="mt-4" :employers="me.employers" :current="me.employer" @switch="switchEmployer" />
      <p v-else class="mt-4 truncate text-sm font-semibold" style="color: color-mix(in srgb, var(--portal-white) 70%, transparent)">{{ me?.employer?.name ?? '…' }}</p>
      <nav class="mt-6 grid gap-1 text-sm" aria-label="Portal">
        <NuxtLink
          v-for="l in links" :key="l.to" :to="withEmployer(l.to)"
          class="portal-nav flex min-h-11 items-center gap-3 rounded-lg px-3 font-semibold"
          :class="isActive(l.to) ? 'portal-nav-active' : 'portal-nav-idle'"
        >
          <component :is="l.icon" class="size-5 shrink-0" aria-hidden="true" />{{ l.label }}
        </NuxtLink>
      </nav>
      <div class="mt-auto grid gap-2 pt-6">
        <p class="truncate text-sm" style="color: color-mix(in srgb, var(--portal-white) 70%, transparent)">{{ me?.user?.name ?? me?.user?.email ?? '' }}</p>
        <button type="button" class="portal-nav portal-nav-idle flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold" @click="logout">
          <LogOut class="size-5 shrink-0" aria-hidden="true" />Abmelden
        </button>
      </div>
    </aside>

    <!-- Handy: Kopfzeile -->
    <header class="flex items-center gap-3 px-4 py-3 md:hidden" style="background: var(--portal-ink); color: var(--portal-white)">
      <div class="min-w-0 flex-1">
        <p class="portal-display text-lg leading-tight" style="color: var(--portal-white)">pflege-jobs</p>
        <PortalEmployerSwitch v-if="canSwitch" class="mt-1" :employers="me.employers" :current="me.employer" @switch="switchEmployer" />
        <p v-else class="truncate text-xs" style="color: color-mix(in srgb, var(--portal-white) 70%, transparent)">{{ me?.employer?.name ?? '…' }}</p>
      </div>
      <button type="button" class="portal-nav portal-nav-idle flex size-11 shrink-0 items-center justify-center rounded-lg" title="Abmelden" aria-label="Abmelden" @click="logout">
        <LogOut class="size-5" aria-hidden="true" />
      </button>
    </header>

    <main class="min-w-0 p-4 pb-24 md:p-8 md:pb-8">
      <div class="mx-auto max-w-[1100px]"><slot /></div>
    </main>

    <!-- Handy: Tab-Leiste -->
    <nav class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 md:hidden" aria-label="Portal" style="background: var(--portal-ink); padding-bottom: env(safe-area-inset-bottom)">
      <NuxtLink
        v-for="l in links" :key="l.to" :to="withEmployer(l.to)"
        class="portal-nav flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold"
        :class="isActive(l.to) ? 'portal-tab-active' : 'portal-nav-idle'"
      >
        <component :is="l.icon" class="size-5" aria-hidden="true" />{{ l.label }}
      </NuxtLink>
    </nav>
  </div>
</template>
<script setup lang="ts">
import { LayoutDashboard, Briefcase, Users, Building2, LogOut } from 'lucide-vue-next'

const route = useRoute()
// /api/portal/me entsteht in Task 7; bis dahin Fehler abfangen und „…“ anzeigen.
const { data: me } = await useFetch<any>('/api/portal/me', { query: computed(() => ({ employer: route.query.employer })), onResponseError: () => {} })
const canSwitch = computed(() => me.value?.user.role === 'rhowerk' && !!me.value.employers?.length)
const links = [
  { to: '/portal', label: 'Übersicht', icon: LayoutDashboard }, { to: '/portal/stellen', label: 'Stellen', icon: Briefcase },
  { to: '/portal/bewerbungen', label: 'Bewerbungen', icon: Users }, { to: '/portal/profil', label: 'Profil', icon: Building2 },
]
const withEmployer = (to: string) => (route.query.employer ? `${to}?employer=${route.query.employer}` : to)
const isActive = (to: string) => (to === '/portal' ? route.path === '/portal' : route.path.startsWith(to))
function switchEmployer(id: string) { navigateTo({ path: route.path, query: { ...route.query, employer: id } }) }
async function logout() { await $fetch('/api/auth/logout', { method: 'POST' }); await useUserSession().clear(); navigateTo('/portal/login') }
</script>
<style scoped>
.portal-nav:focus-visible { outline: 2px solid var(--portal-mint); outline-offset: -2px; }
.portal-nav-idle { color: color-mix(in srgb, var(--portal-white) 70%, transparent); }
.portal-nav-active { background: var(--portal-mint); color: var(--portal-ink); }
.portal-tab-active { color: var(--portal-mint); }
@media (hover: hover) { .portal-nav-idle:hover { color: var(--portal-white); } }
</style>
