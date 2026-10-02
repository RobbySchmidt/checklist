<template>
  <header id="siteHeader" class="sticky top-0 z-40 w-full border-b border-border bg-background px-4 md:px-8">
    <div class="flex h-16 items-center justify-between gap-6">
      <NuxtLink to="/" class="relative z-50 flex shrink-0 items-center" aria-label="Zur Startseite" @click="closeMenu">
        <img
          v-if="general?.logo"
          :src="getAssetUrl() + general.logo.filename_disk"
          :alt="general.logo.title || siteName"
          width="150"
          height="39"
          class="block h-auto w-[120px] xl:w-[150px]">
        <span v-else class="text-lg font-semibold tracking-tight">{{ siteName || 'Homepage' }}</span>
      </NuxtLink>

      <WebsiteMainMenu v-if="navigation" :items="menuItems" :cta="ctaItem" :phone="general?.phone" />

      <!-- CTA als shadcn-Button (Desktop) -->
      <div class="hidden shrink-0 items-center gap-5 xl:flex">
        <Button v-if="ctaItem" as-child size="sm">
          <NuxtLink :to="menuUrl(ctaItem)" :target="ctaItem.open_in_new_tab ? '_blank' : undefined">{{ ctaItem.title }}</NuxtLink>
        </Button>
      </div>

      <!-- Burger (mobil) -->
      <button
        type="button"
        aria-controls="main-menu"
        :aria-label="store.menuOpen ? 'Navigation schließen' : 'Navigation öffnen'"
        :aria-expanded="store.menuOpen"
        class="relative z-50 -mr-2 flex h-11 w-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
        @click="store.menuOpen = !store.menuOpen">
        <span class="relative block h-0.5 w-6">
          <span class="absolute left-0 block h-0.5 w-6 bg-current transition duration-300 ease-in-out motion-reduce:transition-none" :class="store.menuOpen ? 'rotate-45' : '-translate-y-1.5'" />
          <span class="absolute left-0 block h-0.5 w-4 bg-current transition duration-300 ease-in-out motion-reduce:transition-none" :class="{ 'opacity-0': store.menuOpen }" />
          <span class="absolute left-0 block h-0.5 w-6 bg-current transition duration-300 ease-in-out motion-reduce:transition-none" :class="store.menuOpen ? '-rotate-45' : 'translate-y-1.5'" />
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { useStore } from '~/stores/store'
  import { menuUrl } from '~/utils/menu'

  const { getItems } = useDirectusItems()
  const siteName = (useRuntimeConfig().public.siteName as string) || ''
  const store = useStore()

  function closeMenu() {
    store.menuOpen = false
    store.openSubMenuId = null
  }

  const { data: navigation } = await useAsyncData('mainNavigation', () => getItems({
    collection: 'navigation',
    params: {
      filter: { title: { _eq: 'Main' } },
      fields: ['isLastMenuItemHighlighted', 'items.*', 'items.page.slug', 'items.children.*', 'items.children.page.slug'],
    },
  }) as Promise<any[]>, { transform: (data) => data?.[0] ?? null })

  const { data: general } = await useGeneral()

  // Letzter Menüpunkt wird bei isLastMenuItemHighlighted als Button (Primärfarbe) rechts gerendert
  const items = computed<any[]>(() => navigation.value?.items ?? [])
  const highlighted = computed(() => !!navigation.value?.isLastMenuItemHighlighted && items.value.length > 0)
  const menuItems = computed(() => (highlighted.value ? items.value.slice(0, -1) : items.value))
  const ctaItem = computed(() => (highlighted.value ? items.value[items.value.length - 1] : null))
</script>
