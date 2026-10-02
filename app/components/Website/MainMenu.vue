<template>
  <!-- mobil: Vollbild-Panel unter dem Header (h-16), schiebt von rechts rein · Desktop: Inline-Leiste -->
  <div
    id="menu-holder"
    class="fixed inset-x-0 top-16 bottom-0 z-20 overflow-y-auto bg-background transition-transform duration-300 ease-out motion-reduce:transition-none xl:static xl:inset-auto xl:translate-x-0 xl:overflow-visible xl:bg-transparent"
    :class="store.menuOpen ? 'translate-x-0' : 'translate-x-full'">
    <nav ref="navEl" id="main-menu" aria-label="Hauptnavigation" class="px-4 py-4 md:px-8 xl:p-0">
      <ul class="flex flex-col xl:flex-row xl:items-center xl:gap-1">
        <WebsiteMenuItem v-for="item in items" :key="item.id" :menu-item="item" />

        <!-- mobil: CTA als voller Button am Ende der Liste -->
        <li v-if="cta" class="mt-6 xl:hidden">
          <Button as-child size="lg" class="w-full">
            <NuxtLink :to="menuUrl(cta)" :target="cta.open_in_new_tab ? '_blank' : undefined" @click="closeMenu">{{ cta.title }}</NuxtLink>
          </Button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
  import { useStore } from '~/stores/store'
  import { menuUrl } from '~/utils/menu'

  const store = useStore()

  defineProps({
    items: { type: Array as PropType<any[]>, default: () => [] },
    cta: { type: Object as PropType<any>, default: null },
    phone: { type: String, default: '' },
  })

  const navEl = ref<HTMLElement | null>(null)
  const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 1280

  function closeMenu() {
    store.menuOpen = false
    store.openSubMenuId = null
  }

  // Mobil-Panel für Screenreader/Tab-Fokus ausblenden, solange es geschlossen ist
  function updateInert() {
    if (!navEl.value) return
    const hidden = !isDesktop() && !store.menuOpen
    navEl.value.toggleAttribute('inert', hidden)
    if (hidden) navEl.value.setAttribute('aria-hidden', 'true')
    else navEl.value.removeAttribute('aria-hidden')
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key !== 'Escape' || isDesktop() || !store.menuOpen) return
    closeMenu()
    nextTick(() => (document.querySelector('button[aria-controls="main-menu"]') as HTMLElement | null)?.focus())
  }

  onMounted(() => {
    updateInert()
    window.addEventListener('resize', updateInert)
    document.addEventListener('keydown', handleEscape)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateInert)
    document.removeEventListener('keydown', handleEscape)
    document.body.classList.remove('overflow-hidden', 'xl:overflow-auto')
  })

  watch(() => store.menuOpen, (open) => {
    document.body.classList.toggle('overflow-hidden', open)
    document.body.classList.toggle('xl:overflow-auto', open)
    updateInert()
  })
</script>
